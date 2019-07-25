#!/usr/bin/env bash

set -x
set -euo pipefail

## decrypt ssh key and set up ssh connection to pantheon
openssl aes-256-cbc -K $encrypted_2a8fab67e230_key -iv $encrypted_2a8fab67e230_iv -in .ci/sitekit_rsa.enc -out /tmp/sitekit_rsa -d
eval "$(ssh-agent -s)"
chmod 600 /tmp/sitekit_rsa
ssh-add /tmp/sitekit_rsa
echo -e "Host *\n\tStrictHostKeyChecking no" >> ~/.ssh/config && chmod 700 ~/.ssh/config  ## replace with Tranvis ssh_know_hosts addon?

## build the site files
composer install --no-dev --no-interaction
npm install
npm install -g gulp-cli webpack
npm run build:svg
npm run build:images
npm run dev

## log in on terminus
$TERMINUS auth:login --machine-token=$TERMINUS_TOKEN

## clone repo to temp directory
export REPO_DIR=$(pwd)
- mkdir /tmp/repo && pushd /tmp/repo || exit 1
- git clone $PANTHEON_REPO .

## set up multidev site for this PR

if [ "$TRAVIS_PULL_REQUEST" != "false" ]
then
    export PR_BRANCH="pr-${TRAVIS_PULL_REQUEST}"
    ## check if a git branch already exists for this PR on pantheon & check it out, if not create one
        if ! git rev-parse --verify --quiet $PR_BRANCH
        then
            git checkout -b $PR_BRANCH
        else
            git checkout $PR_BRANCH
        fi
        ## copy files from $REPO_DIR to pantheon repo
        mkdir -p wp-content/plugins/site-kit-wp   ## ensure plugin dir exists
        rsync -rxc --delete $REPO_DIR/* /tmp/repo/wp-content/plugins/site-kit-wp/ --exclude-from=$TRAVIS_BUILD_DIR/.ci/rsync-excludes.txt
        git status
        git add .
        git commit --quiet -m "${TRAVIS_COMMIT_MESSAGE}"
        git push --quiet origin $PR_BRANCH
        ## if multidev site does not already exist
        if ! $TERMINUS multidev:list $PANTHEON_SITE --format=list | grep $PR_BRANCH
        then
            echo "creating site for ${PR_BRANCH}"
            $TERMINUS multidev:create $PANTHEON_SITE.live $PR_BRANCH
        fi
    fi
echo "done"