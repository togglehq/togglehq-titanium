# ToggleHQ [Appcelerator Titanium](https://www.appcelerator.com) Plugin

## Requirements

The ToggleHQ [Appcelerator Titanium](https://www.appcelerator.com) Plugin requires iOS 8.0+

## Installation

To install it, simply add the following line to your app.js file:

```js
require("path/to/togglehq.js");
```

Create your application by visiting [ToggleHQ.com](https://togglehq.com) and either registering or logging into an existing account. Once you're in head to **App Settings** > **API Access** and grab your **Mobile OAuth Credentials**. You'll use those to install ToggleHQ.

```js
// app.js

require("path/to/togglehq.js");

THQ.init({
  client_id: "your-mobile-oauth-client-id",
  secret: "your-mobile-oauth-secret"
});
```

## Basic Usage

Using these implementation methods are the quickest and fastest way to get ToggleHQ installed and running in your app.

#### On Login/Signup Assign This Device to a User

```js
THQ.assignDeviceToUser("user_identifier", successCallback, failureCallback);
```

#### On Logout Assign This Device to a User

```js
THQ.unassignDevice(successCallback, failureCallback);
```

#### Display Preferences Popup

```js
THQ.requestCustomPermissions({
  image: "path/to/image.png",  // Optional
  header: "Example Header",  // Optional
  subHeader: "Here's some more information.", // Optional
  color: "#00ff00" // Optional
})
```

#### Open Preferences Page

```js
var win = THQ.createPreferencesWindow({
  title: "Preferences", // Optional
  barColor: "#00ff00", // Optional
  tintColor: "#fff" // Optional
})

self.containingTab.open(win, {animated: true});
```

## Additional Usage

While above displays the simplest methods for using ToggleHQ, you are also able to use more advanced methods to create a more customized solution.

#### Enable a preference for the current user or device

```js
THQ.enablePreference("category_key", "preference_key", successCallback, failureCallback);
```

#### Disable a preference for the current user or device

```js
THQ.disablePreference("category_key", "preference_key", successCallback, failureCallback);
```

#### Get all preferences for the current user or device

```js
THQ.getPreferences(successCallback, failureCallback);
```

##### Example:

```js
THQ.getPreferences(function(response){
  // Success
  // response: An array of categories and preferences
}, function(response){
  // Failure
  // response: A JSON object with a failure message
});
```


## License

The ToggleHQ [Appcelerator Titanium](https://www.appcelerator.com) plugin is available under the MIT license. See the LICENSE file for more info.
