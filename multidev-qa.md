# MultiDev QA Environments

This PR is for setting up QA envrionments for each PR on Pantheon using TravisCI. When these pull requests are opened, a multidev site is automatically created on Pantheon and the branch is deployed to this new site.

## Setup

All of the multidev site creation and deployment logic is contained in the `.travisci.yml` file, but some specific configuration needs to be done for Travis and Pantheon for this to work.

### Terminus Machine Token

We use [Terminus](https://pantheon.io/docs/terminus/) to create the multidev sites on Pantheon. To allow Terminus to connect to the Pantheon account for site-kit, a [machine token](https://pantheon.io/docs/machine-tokens/) must be created and added as a secret envrionment variable to the Travis CI configuration. Create the machine token and add the variable to Travis with the name `TERMINUS_TOKEN`.

### Encrypted Deploy SSH key for Pantheon

#### Private key

Deploymenet to Pantheon is done with git and requires an SSH key that is avaliable to the deploy source and has the public key installed into the Pantheon account. The private key for the deployment, must be encrypted using Travis' [file encryption](https://docs.travis-ci.com/user/encrypting-files/) feature. [this tutorial](https://oncletom.io/2016/travis-ssh-deploy/) is a good description of how to set this up.

1. Create new ssh key for this deploy
2. Encrypt ssh private key using the Travis cli tool and commit to the repo
3. Edit line 7 of `.ci/multidev.sh`, replacing that line with the decryption command output from the travis ci tool
4. Ensure the decryption command targets the correct file path in the repo
5. Ensure only the encrypted private key file is commited to the repo, not the plain text file

#### Public key

Add the public half of this new key pair to the [Pantheon dashboard](https://pantheon.io/docs/ssh-keys/) for an account that has push access to the account where code will be deployed.

### Pantheon Git Repo and Site Name

Add the Pantheon git repo URL to the Travis configuration as a protected envrionment variable, named `PANTHEON_REPO`.

The Pantheon site name is used to target the correct site on the Pantheon account when using Terminus to create multidev sites. Define the `PANTHEON_SITE` varible on line 41 of `.travisci.yml` to be the correct name for the site from the Pantheon dashboard.

## Travis Vs Pull Requests

Unfortunately it looks like this workflow is not going to work with Travis. They, as a rule, do not run their `deploy` steps for a Pull Request because of security concerns. I had initially been testing this process by disabling all the test jobs, to speed up builds, and using the `after_success` step, which worked well for deploying the PRs. But after re-enabling the tests, Travis tried to run the `after_success` commands after each test finished, rather than at the end of the build. To remedy this I tried to switch over to the `deploy` stage using the script provider this was when I found out they do not run the deploy step for PRs.

```
Skipping a deployment with the script provider because the current build is a pull request.
```