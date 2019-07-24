/**
 * WordPress dependencies
 */
import { activatePlugin, visitAdminPage } from '@wordpress/e2e-test-utils';

describe( 'Providing client configuration', () => {

	beforeEach( async() => {
		await activatePlugin( 'google-site-kit' );
		await visitAdminPage( 'admin.php', 'page=googlesitekit-splash' );
	} );

	it( 'Should have disabled button on load', async() => {

		await page.waitForSelector( '#wizard-step-one-proceed' );

		const proceedButton = await page.$$eval( '#wizard-step-one-proceed', el => el.map( x => x.hasAttribute( 'disabled' ) ) );

		// const proceedButton = await page.$x(
		// 	'//button[@disabled][contains(@id,"wizard-step-one-proceed")]'
		// );

		expect( proceedButton.length ).not.toEqual( 0 );
	} );


	it( 'Should have disabled button and display error when input is invalid', async() => {

		await page.waitForSelector( '#client-configuration' );
		page.click( '#client-configuration' );
		await page.keyboard.type( 'This is not valid JSON' );

		//error
		await page.waitForSelector( '.googlesitekit-error-text' );
		const errorMessage = await page.$x(
			'//p[contains(@class,"googlesitekit-error-text") and contains(text(), "Unable to parse client configuration values.")]'
		);
		expect( errorMessage.length ).not.toEqual( 0 );

		// button
		const proceedButton = await page.$$eval( '#wizard-step-one-proceed', el => el.map( x => x.hasAttribute( 'disabled' ) ) );
		expect( proceedButton.length ).not.toEqual( 0 );
	} );

	it( 'Should have enabled button valid value', async() => {

		await page.waitForSelector( '#client-configuration' );
		page.click( '#client-configuration' );

		await page.waitFor( 1000 );

		const configJSON = `{
			"web": {
				"client_id": "123-456.apps.googleusercontent.com",
				"project_id": "lorem-ipsum-123456",
				"auth_uri": "https://accounts.google.com/o/oauth2/auth",
				"token_uri": "https://accounts.google.com/o/oauth2/token",
				"auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
				"client_secret": "this_is_not_real"
			}
		}`;
		await page.keyboard.type( configJSON );

		const proceedButton = await page.$x(
			'//button[not(@disabled)][contains(@id,"wizard-step-one-proceed")]'
		);
		expect( proceedButton.length ).not.toEqual( 0 );

		page.click( '#wizard-step-one-proceed' );

		await page.waitForSelector( '.googlesitekit-wizard-step--two' );

		const stepTwoTitle = await page.$x(
			'//h2[contains(@class,"googlesitekit-wizard-step__title") and contains(text(), "Authenticate with Google")]'
		);

		expect( stepTwoTitle.length ).not.toEqual( 0 );

	} );

} );