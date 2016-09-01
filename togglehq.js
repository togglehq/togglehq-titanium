var THQ = {};

(function() {
  var self = THQ;

  self.credentials = {
    base_url: "https://api.togglehq.com",
    headers: {
      accept: 'application/vnd.togglehq.com;version=1'
    }
  }

  self.current = {
    user_identifier: Ti.App.Properties.getString("thq_user") || null,
    access_token: Ti.App.Properties.getString("thq_access_token") || null,
    access_token_expires_at: Ti.App.Properties.getString("thq_access_token_expires_at") || null,
    device_token: Ti.App.Properties.getString("thq_device_token") || null,
    device_uuid: Ti.App.Properties.getString("thq_device_uuid") || null
  }

  // 1) /devices/create (on app open to create uuid)
  // 2) /settings (for device)
  // 3) /devices/assign (on login)
  // 4) /settings (for user)
  // 5) /devices/unassign (on logout)

  //
  // Sending/Getting/Updating methods
  //

  self.getAccessToken = function(successCallback, errorCallback) {
    if (self.current.access_token && self.current.access_token_expires_at) {
      var now = new Date();
      var expires_at = new Date(self.current.access_token_expires_at);

      if(now >= expires_at){
        // Clear the expired token
        Ti.App.Properties.setString("thq_access_token", null);
        Ti.App.Properties.setString("thq_access_token_expires_at", null);
        self.current.access_token = null;
        self.current.access_token_expires_at = null;

        // Expired token, so go get a new one by re-running this
        self.getAccessToken(successCallback, errorCallback);
      } else {
        // Not expired, fire it!
        // Return the current access token
        successCallback && successCallback();
      }
    } else {
      var xhr = Ti.Network.createHTTPClient();
      var auth_url = self.credentials.base_url + "/oauth/token";

      xhr.open("POST", auth_url, !0);
      xhr.timeout = 10000;
      Ti.API.info("[THQ] client_id: "+self.credentials.client_id);
      Ti.API.info("[THQ] client_secret: "+self.credentials.client_secret);
      var basic = Ti.Utils.base64encode(self.credentials.client_id + ":" + self.credentials.client_secret).toString().replace(/(\r\n|\n|\r)/gm, "");
      Ti.API.info("[THQ] basic: "+basic);
      var authstr = "Basic " + basic;

      xhr.setRequestHeader("Authorization", authstr);
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

      xhr.onerror = function(e) {
        var response = {
          error: e.error,
          status: this.status
        };
        try {
            this.responseText && (response = eval("(" + this.responseText + ")"))
        } catch (err) {}
        errorCallback && errorCallback(response)
      }, xhr.onload = function(e) {
        var response = eval("(" + this.responseText + ")");
        Ti.API.debug("[THQ] AccessToken onload: " + JSON.stringify(response));

        try {
          var expires_at = (response.created_at+response.expires_in)*1000;
          Ti.API.debug("[THQ] Token Expires At: "+expires_at);

          Ti.App.Properties.setString("thq_access_token", response.access_token);
          Ti.App.Properties.setString("thq_access_token_expires_at", expires_at);
          self.current.access_token = response.access_token;
          self.current.access_token_expires_at = expires_at;

          successCallback && successCallback();
        } catch (E) {
          Ti.API.debug("[THQ]  Failed to get access token..."), errorCallback && errorCallback(response)
        }
      };

      // Send what we're asking for
      xhr.send({ grant_type: "client_credentials", scope: "togglehq-sdk" });
    }
  }

  //
  // Post to the api
  //

  self.post = function(url, params, successCallback, errorCallback){
    var xhr = Ti.Network.createHTTPClient();
    var params = params || {};
    var auth_url = self.credentials.base_url+url;

    self.getAccessToken(function(){
      xhr.open("POST", auth_url);
      xhr.timeout = 10000;
      xhr.setRequestHeader("Content-Type", "application/json")
      xhr.setRequestHeader("Accept", self.credentials.headers.accept);

      if(self.current.access_token){
        xhr.setRequestHeader("Authorization", "Bearer " + self.current.access_token);
      }

      xhr.onerror = function(e) {
        var response = {
          error: e.error,
          status: this.status
        };
        try {
          this.responseText && (response = eval("(" + this.responseText + ")"))
        } catch (err) {}
        errorCallback && errorCallback(response)
      };

      xhr.onload = function(e) {
        var response = eval("(" + this.responseText + ")");
        try {
          successCallback(response)
        } catch (E) {
          errorCallback && errorCallback(response)
        }
      };

      xhr.send(JSON.stringify(params));
    });
  };

  //
  // Patch to the api
  //

  self.patch = function(url, params, successCallback, errorCallback){
    var xhr = Ti.Network.createHTTPClient();
    var params = params || {};
    var auth_url = self.credentials.base_url+url;

    self.getAccessToken(function(){
      xhr.open("PATCH", auth_url);
      xhr.timeout = 10000;
      xhr.setRequestHeader("Content-Type", "application/json")
      xhr.setRequestHeader("Accept", self.credentials.headers.accept);

      if(self.current.access_token){
        xhr.setRequestHeader("Authorization", "Bearer " + self.current.access_token);
      }

      xhr.onerror = function(e) {
        var response = {
          error: e.error,
          status: this.status
        };
        try {
          this.responseText && (response = eval("(" + this.responseText + ")"))
        } catch (err) {}
        errorCallback && errorCallback(response)
      };

      xhr.onload = function(e) {
        var response = eval("(" + this.responseText + ")");
        try {
          successCallback(response)
        } catch (E) {
          errorCallback && errorCallback(response)
        }
      };

      xhr.send(JSON.stringify(params));
    });
  };

  //
  // Get from the api
  //

  self.get = function(url, params, successCallback, errorCallback){
    var serialize = function(e, r) {
      var s = [];
      for (var t in e) {
        var a = r ? r + "[" + t + "]" : t,
          n = e[t];
        s.push("object" == typeof n ? serialize(n, a) : encodeURIComponent(a) + "=" + encodeURIComponent(n));
      }
      return s.join("&");
    }

    var xhr = Ti.Network.createHTTPClient();
    var param_string = "";
    params && (param_string = "?" + serialize(params));
    var auth_url = self.credentials.base_url+url+param_string;

    self.getAccessToken(function(){
      xhr.open("GET", auth_url);
      xhr.timeout = 1000;
      xhr.setRequestHeader("Content-Type", "application/json")
      xhr.setRequestHeader("Accept", self.credentials.headers.accept);

      if(self.current.access_token){
        xhr.setRequestHeader("Authorization", "Bearer " + self.current.access_token);
      }

      xhr.onerror = function(e) {
        var response = {
          error: e.error,
          status: this.status
        };
        try {
          this.responseText && (response = eval("(" + this.responseText + ")"))
        } catch (err) {}
        errorCallback && errorCallback(response)
      };

      xhr.onload = function(e) {
        var response = eval("(" + this.responseText + ")");
        try {
          successCallback(response)
        } catch (E) {
          errorCallback && errorCallback(response)
        }
      };

      xhr.send();
    });
  };

  //
  // Initialize the device
  //

  self.init = function(opts, success, failure){
    if(!opts.client_id || !opts.secret){
      Ti.API.warn("[THQ] Initializing ToggleHQ without client_id or secret");
      return;
    }

    self.credentials.client_id = opts.client_id;
    self.credentials.client_secret = opts.secret;

    if(!self.current.device_uuid){
      var params = {
        device: {
          os: Ti.Platform.osname,
          os_version: Ti.Platform.version,
          manufacturer: Ti.Platform.manufacturer,
          model: Ti.Platform.model
        }
      };

      self.post("/devices", params, function(response){
        // Successfully added device
        Ti.API.debug("[THQ] Successfully added device "+JSON.stringify(response));

        if(response.device){
          Ti.App.Properties.setString("thq_device_uuid", response.device.uuid);
          self.current.device_uuid = response.device.uuid;
        }

        if(success){
          success(response);
        };
      }, function(response){
        // Failed to add the device
        Ti.API.debug("[THQ] Failed to add device "+JSON.stringify(response));

        if(failure){
          success(failure);
        };
      });
    } else {
      // Already initialized this device!
      Ti.API.debug("[THQ] Already initialized device: "+self.current.device_uuid);
    }
  }

  //
  // Get settings
  //

  self.getSettings = function(success, failure){
    if(!self.current.device_uuid){
      Ti.API.debug("[THQ] Please initialize the device using self.initDevice()");
      return;
    }

    var params = {device: {uuid: self.current.device_uuid}};

    // If we have a user get the user's settings
    if(self.current.user_identifier){
      params = {user: {identifier: self.current.user_identifier}};
    }

    self.get("/settings", params, function(response){
      // Successfully got settings
      Ti.API.debug("[THQ] Successfully got settings "+JSON.stringify(response));

      if(success){
        success(response);
      };
    }, function(response){
      // Failed to get settings
      Ti.API.debug("[THQ] Failed to get settings "+JSON.stringify(response));

      if(failure){
        success(failure);
      };
    });
  }

  //
  // Enable a setting
  //

  self.enableSetting = function(group, setting, success, failure){
    if(!self.current.device_uuid){
      Ti.API.debug("[THQ] Please initialize the device using self.initDevice()");
      return;
    }

    var params = {group: group, setting: setting};

    // Send up either a device or user
    if(self.current.user_identifier){
      params.user = {identifier: self.current.user_identifier};
    } else {
      params.device = {uuid: self.current.device_uuid};
    };

    self.patch("/settings/enable", params, function(response){
      // Successfully enable setting
      Ti.API.debug("[THQ] Successfully enabled setting "+JSON.stringify(response));

      if(success){
        success(response);
      };
    }, function(response){
      // Failed to enable setting
      Ti.API.debug("[THQ] Failed to enable setting "+JSON.stringify(response));

      if(failure){
        success(failure);
      };
    });
  }

  //
  // Enable a setting
  //

  self.disableSetting = function(group, setting, success, failure){
    if(!self.current.device_uuid){
      Ti.API.debug("[THQ] Please initialize the device using self.initDevice()");
      return;
    }

    var params = {group: group, setting: setting};

    // Send up either a device or user
    if(self.current.user_identifier){
      params.user = {identifier: self.current.user_identifier};
    } else {
      params.device = {uuid: self.current.device_uuid};
    };

    self.patch("/settings/disable", params, function(response){
      // Successfully disabled setting
      Ti.API.debug("[THQ] Successfully disabled setting "+JSON.stringify(response));

      if(success){
        success(response);
      };
    }, function(response){
      // Failed to disable setting
      Ti.API.debug("[THQ] Failed to disable setting "+JSON.stringify(response));

      if(failure){
        success(failure);
      };
    });
  }

  //
  // Assign a device to this user
  //

  self.assignDeviceToUser = function(identifier, success, failure){
    if(!self.current.device_uuid){
      Ti.API.debug("[THQ] Please initialize the device using self.initDevice()");
      return;
    }

    var params = {
      device: {uuid: self.current.device_uuid},
      user: {identifier: identifier}
    };

    self.patch("/devices/assign", params, function(response){
      // Successfully assigned the device
      Ti.API.debug("[THQ] Successfully assigned device "+JSON.stringify(response));

      Ti.App.Properties.setString("thq_user_identifier", identifier);
      self.current.user_identifier = identifier;

      if(success){
        success(response);
      };
    }, function(response){
      // Failed to assign the device
      Ti.API.debug("[THQ] Failed to assign device "+JSON.stringify(response));

      if(failure){
        success(failure);
      };
    });
  }

  //
  // Assign a device to this user
  //

  self.unassignDevice = function(success, failure){
    if(!self.current.device_uuid){
      Ti.API.debug("[THQ] Please initialize the device using self.initDevice()");
      return;
    }

    var params = {
      device: {uuid: self.current.device_uuid}
    };

    self.patch("/devices/unassign", params, function(response){
      // Successfully unassign the device
      Ti.API.debug("[THQ] Successfully unassigned device "+JSON.stringify(response));

      Ti.App.Properties.setString("thq_user_identifier", null);
      self.current.user_identifier = null;

      if(success){
        success(response);
      };
    }, function(response){
      // Failed to unassign the device
      Ti.API.debug("[THQ] Failed to unassign device "+JSON.stringify(response));

      if(failure){
        success(failure);
      };
    });
  }

  //
  // Assign a device to this user
  //

  self.enableDevice = function(token, success, failure){
    if(!self.current.device_uuid){
      Ti.API.debug("[THQ] Please initialize the device using self.initDevice()");
      return;
    }

    var params = {
      device: {uuid: self.current.device_uuid, token: token}
    };

    self.patch("/devices/enable", params, function(response){
      // Successfully enabled the device
      Ti.API.debug("[THQ] Successfully enabled device "+JSON.stringify(response));

      Ti.App.Properties.setString("thq_device_token", token);
      self.current.device_token = token;

      if(success){
        success(response);
      };
    }, function(response){
      // Failed to enable the device
      Ti.API.debug("[THQ] Failed to enable device "+JSON.stringify(response));

      if(failure){
        success(failure);
      };
    });
  }

  //
  // Registerring for push
  //

  self.registerForPush = function(button, callback){

    //Check if the device is running iOS 8 or later
    if (Ti.Platform.name == "iPhone OS" && parseInt(Ti.Platform.version.split(".")[0]) >= 8) {
      Ti.API.debug("[THQ] Registerring on iOS 8");
      // Wait for user settings to be registered before registering for push notifications
      Ti.App.iOS.addEventListener('usernotificationsettings', self.registerIos8Plus);
      // Register notification types to use
      Ti.App.iOS.registerUserNotificationSettings({
        types: [Ti.App.iOS.USER_NOTIFICATION_TYPE_ALERT, Ti.App.iOS.USER_NOTIFICATION_TYPE_SOUND, Ti.App.iOS.USER_NOTIFICATION_TYPE_BADGE]
      });
    } else {
      // For iOS 7 and earlier
      Ti.Network.registerForPushNotifications({
        // Specifies which notifications to receive
        types: [Ti.Network.NOTIFICATION_TYPE_BADGE,Ti.Network.NOTIFICATION_TYPE_ALERT,Ti.Network.NOTIFICATION_TYPE_SOUND],
        success: self.deviceTokenSuccess,
        error: self.deviceTokenError,
        callback: self.receivePush
      });
    };
  };

  // Actually register them for iOS 8+
  self.registerIos8Plus = function() {
    Ti.Network.registerForPushNotifications({
      success: self.deviceTokenSuccess,
      error: self.deviceTokenError,
      callback: self.receivePush
    });
  };

  // What to do when we get a push
  self.receivePush = function(e) {
    Ti.API.debug("[THQ] Received push notification: "+JSON.stringify(e));
  };

  // On successfully getting a token
  self.deviceTokenSuccess = function(e) {
    Ti.API.debug("[THQ] Got device token: "+e.deviceToken);
    self.enableDevice(e.deviceToken);
  };

  // On failing to get a token
  self.deviceTokenError = function(e) {
    Ti.API.debug("[THQ] THQ Failed to get device token "+JSON.stringify(e));
  };

  //
  // Create a Settings Window
  //

  self.createSettingsWindow = function(opts){
    var opts = opts || {};

    var win = Ti.UI.createWindow({
      title: opts.title || "Notifications",
      barColor: Design.colors.navbar,
      navTintColor: Design.colors.tint,
      tintColor: Design.colors.tint,
      backgroundColor: Color(Design.colors.background).toHexString(),
      containingTab: opts.containingTab,
      titleAttributes: {
        color: Design.colors.tint,
        font: {
          fontSize: 17
        }
      },
      navBarHidden: true,
      tabBarHidden: true
    });

    win.table = Ti.UI.createTableView({
      backgroundColor: "#fff",
      separatorColor: "#e2e2e2",
      selectionStyle: "none",
      showVerticalScrollIndicator: false,
      data: [],
      empty: !0,
      top: 0,
      bottom: 0,
      minRowHeight: 60,
      editing: !1,
      moving: !1,
      headerInsets: {
        left: 10,
        right: 10
      },
      separatorInsets: {
        left: 0,
        right: 0
      },
      footerView: Ti.UI.createView({height: .5,left: 0,right: 0, backgroundColor: "#e2e2e2"})
    });

      var loading_row = Ti.UI.createTableViewRow({
        height: (Device.height-70),
        selectedBackgroundColor: "transparent",
        selectionStyle: "none",
        backgroundColor: "transparent"
      });

      if(Device.isIOS){
        var indicator = Ti.UI.createActivityIndicator({
          message: "",
          style: Ti.UI.ActivityIndicatorStyle.DARK,
          height: Ti.UI.SIZE,
          width: Ti.UI.SIZE
        });

          loading_row.add(indicator);
          indicator.show();
      }

      win.table.setData([loading_row]);

    function loadSettings(){
      self.getSettings(function(response){
        var sections = [];
        var groups = response;

        for(var i=0;i<groups.length;i++){
          var group = groups[i];
          Ti.API.debug("[THQ] group: "+JSON.stringify(group))
          var settings = group.settings;

          var header_view = Ti.UI.createView({
            height: 40,
            backgroundColor: "#f2f2f2"
          });

            header_view.label = Ti.UI.createLabel({
              text: group.name,
              left: 15,
              bottom: 5,
              font: {
                fontSize: 14,
                fontWeight: "Bold"
              },
              color: "#a2a2a2"
            });

            header_view.border_view = Ti.UI.createView({
              bottom: 0,
              height: .5,
              left: 0,
              right: 0,
              backgroundColor: "#e2e2e2"
            });

            header_view.add(header_view.label);
            header_view.add(header_view.border_view);

          var section = Ti.UI.createTableViewSection({
            title: group.name,
            headerView: header_view
          });

          for(var ii=0;ii<settings.length;ii++){
            var setting = settings[ii];
            Ti.API.debug("[THQ] setting: "+JSON.stringify(setting))

            var row = Ti.UI.createTableViewRow({
              height: 60,
              font: {
                fontSize: 14,
                fontWeight: "Bold"
              },
              color: "#424242",
              backgroundColor: "#fff",
              title: setting.name
            });

            row.switch = Ti.UI.createSwitch({
              right: 20,
              group: group.key,
              setting: setting.key,
              value: setting.enabled,
              onTintColor: Design.colors.skittles.blue
            });

            row.addEventListener("change", function(e){
              Ti.API.debug("[THQ] Toggling "+e.source.group+":"+e.source.setting);

              if(e.value == false){
                // Disable it
                self.disableSetting(e.source.group, e.source.setting);
              } else {
                // Enable it!
                self.enableSetting(e.source.group, e.source.setting);
              }
            });

            row.add(row.switch);
            section.add(row);
          }

          sections.push(section);
        };

        win.table.setData(sections);
      });
    }

    win.addEventListener("open", function(e){
      loadSettings();
    });

    win.add(win.table);

    return win;
  }

})();
