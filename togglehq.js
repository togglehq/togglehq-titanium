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
    user_identifier: Ti.App.Properties.getString("thq_user_identifier") || null,
    access_token: Ti.App.Properties.getString("thq_access_token") || null,
    access_token_expires_at: Ti.App.Properties.getString("thq_access_token_expires_at") || null,
    device_token: Ti.App.Properties.getString("thq_device_token") || null,
    device_uuid: Ti.App.Properties.getString("thq_device_uuid") || null
  }

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
      var os = "ios";
      if(Ti.Platform.osname == "android") os = "android";

      var params = {
        device: {
          os: os,
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
  // Get preferences
  //

  self.getPreferences = function(success, failure){
    if(!self.current.device_uuid){
      Ti.API.debug("[THQ] Please initialize the device using self.initDevice()");
      return;
    }

    var params = {device: {uuid: self.current.device_uuid}};

    // If we have a user get the user's preferences
    if(self.current.user_identifier){
      params = {user: {identifier: self.current.user_identifier}};
    }

    self.get("/preferences", params, function(response){
      // Successfully got preferences
      Ti.API.debug("[THQ] Successfully got preferences "+JSON.stringify(response));

      if(success){
        success(response);
      };
    }, function(response){
      // Failed to get preferences
      Ti.API.debug("[THQ] Failed to get preferences "+JSON.stringify(response));

      if(failure){
        success(failure);
      };
    });
  }

  //
  // Enable a preference
  //

  self.enablePreference = function(category, preference, success, failure){
    if(!self.current.device_uuid){
      Ti.API.debug("[THQ] Please initialize the device using self.initDevice()");
      return;
    }

    var params = {category: category, preference: preference};

    // Send up either a device or user
    if(self.current.user_identifier){
      params.user = {identifier: self.current.user_identifier};
    } else {
      params.device = {uuid: self.current.device_uuid};
    };

    self.patch("/preferences/enable", params, function(response){
      // Successfully enable preference
      Ti.API.debug("[THQ] Successfully enabled preference "+JSON.stringify(response));

      if(success){
        success(response);
      };
    }, function(response){
      // Failed to enable preference
      Ti.API.debug("[THQ] Failed to enable preference "+JSON.stringify(response));

      if(failure){
        success(failure);
      };
    });

    // Make sure they can get notifications
    self.verifyPushEnabled();
  }

  //
  // Enable a preference
  //

  self.disablePreference = function(category, preference, success, failure){
    if(!self.current.device_uuid){
      Ti.API.debug("[THQ] Please initialize the device using self.initDevice()");
      return;
    }

    var params = {category: category, preference: preference};

    // Send up either a device or user
    if(self.current.user_identifier){
      params.user = {identifier: self.current.user_identifier};
    } else {
      params.device = {uuid: self.current.device_uuid};
    };

    self.patch("/preferences/disable", params, function(response){
      // Successfully disabled preference
      Ti.API.debug("[THQ] Successfully disabled preference "+JSON.stringify(response));

      if(success){
        success(response);
      };
    }, function(response){
      // Failed to disable preference
      Ti.API.debug("[THQ] Failed to disable preference "+JSON.stringify(response));

      if(failure){
        success(failure);
      };
    });

    // Make sure they can get notifications
    self.verifyPushEnabled();
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
  // Request custom permissions
  //

  self.requestCustomPermissions = function(opts){
    // Don't actually ask them if we already know they accepted
    // the permissions!
    if(self.current.device_token) return;

    var opts = opts || {};

    var color = opts.color || "#3B5B97";
    var header = opts.header || "Stay Up To Date";
    var sub_header = opts.subHeader || "Turn on notifications to make sure you don't miss anything you care about!";

    var overlay;
    var popup;

    var win = Ti.UI.createWindow({
      navBarHidden: true,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: "transparent"
    });

    function init(){
      if(overlay) return;

      overlay = Ti.UI.createView({
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        backgroundColor: "rgba(0,0,0,0.8)",
        opacity: 0.0
      });

      win.add(overlay);

      overlay.animate({
        opacity: 1.0,
        duration: 250
      }, function(e){
        setTimeout(function(){
          showPopup();
        }, 100);
      });
    };

    function showPopup(){
      if(popup) return;

      popup = Ti.UI.createView({
        width: (Ti.Platform.displayCaps.platformWidth-40),
        height: (Ti.Platform.displayCaps.platformHeight-180),
        backgroundColor: "#fff",
        transform: Ti.UI.create2DMatrix().scale(0.95),
        opacity: 0.0,
        borderRadius: 3
      });


      // First popup view

      var first_view = Ti.UI.createView({
        top: 0,
        right: 0,
        left: 0,
        bottom: 0,
        backgroundColor: "#fff"
      });

        if(opts.image){
          var popup_icon = Ti.UI.createImageView({
            preventDefaultImage: true,
            top: 20,
            height: 124,
            width: 124,
            image: opts.image
          });
        } else {
          var popup_icon = Ti.UI.createView({
            backgroundColor: color,
            backgroundImage: "/images/thq-alert-icon-default.png",
            top: 20,
            height: 124,
            width: 124
          });
        }

        var popup_header = Ti.UI.createLabel({
          text: header,
          top: 164,
          left: 20,
          right: 20,
          height: 26,
          textAlign: "center",
          font: {
            fontSize: 24,
            fontWeight: "Bold"
          },
          color: color
        });

        var popup_subheader = Ti.UI.createLabel({
          text: sub_header,
          top: 200,
          left: 20,
          right: 20,
          textAlign: "center",
          font: {
            fontSize: 17
          },
          color: "#424242"
        });

        var popup_button_one = Ti.UI.createView({
          left: 20,
          right: 20,
          backgroundColor: color,
          height: 60,
          bottom: 130,
          borderWidth: 2,
          borderColor: color,
          borderRadius: 3
        });

          var popup_button_one_label = Ti.UI.createLabel({
            text: "Keep Me Updated",
            left: 20,
            right: 20,
            textAlign: "center",
            font: {
              fontSize: 17,
              fontWeight: "Bold"
            },
            color: "#fff"
          });

          popup_button_one.add(popup_button_one_label);

          popup_button_one.addEventListener("click", function(){
            hidePopup();

            setTimeout(function(){
              THQ.registerForPush();
            }, 100);
          });

        var popup_button_two = Ti.UI.createView({
          bottom: 60,
          left: 20,
          right: 20,
          backgroundColor: "#fff",
          height: 60,
          borderWidth: 2,
          borderColor: color,
          borderRadius: 3
        });

          var popup_button_two_label = Ti.UI.createLabel({
            text: "Customize Notifications",
            left: 20,
            right: 20,
            textAlign: "center",
            font: {
              fontSize: 17,
              fontWeight: "Bold"
            },
            color: color
          });

          popup_button_two.add(popup_button_two_label);

          popup_button_two.addEventListener("click", function(){
            scrollable_view.scrollToView(1);
          });

        var popup_button_three = Ti.UI.createView({
          bottom: 0,
          left: 20,
          right: 20,
          backgroundColor: "#fff",
          height: 60,
          borderWidth: 2,
          borderColor: "#fff",
          borderRadius: 3
        });

          var popup_button_three_label = Ti.UI.createLabel({
            text: "No Thanks",
            left: 20,
            right: 20,
            textAlign: "center",
            font: {
              fontSize: 17
            },
            color: "#959595"
          });

          popup_button_three.add(popup_button_three_label);

          popup_button_three.addEventListener("click", function(){
            hidePopup();
          });

        first_view.add(popup_icon);
        first_view.add(popup_header);
        first_view.add(popup_subheader);
        first_view.add(popup_button_three);
        first_view.add(popup_button_two);
        first_view.add(popup_button_one);

      // Second popup view

      var second_view = Ti.UI.createView({
        top: 0,
        right: 0,
        left: 0,
        bottom: 0,
        backgroundColor: "#00ff00"
      });

        var nav = Ti.UI.createView({
          height: 50,
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: color
        });

          var nav_title = Ti.UI.createLabel({
            text: "Notifications",
            left: 60,
            right: 60,
            textAlign: "center",
            font: {
              fontSize: 17,
              fontWeight: "Bold"
            },
            color: "#fff"
          });

          var button_back = Ti.UI.createView({
            left: 0,
            top: 0,
            bottom: 0,
            width: Ti.UI.SIZE
          });

            var button_back_label = Ti.UI.createLabel({
              text: "Back",
              left: 15,
              right: 10,
              width: Ti.UI.SIZE,
              font: {
                fontSize: 15
              },
              opacity: 0.9,
              color: "#fff"
            });

            button_back.add(button_back_label);

            button_back.addEventListener("click", function(){
              scrollable_view.scrollToView(0);
            });

          var button_done = Ti.UI.createView({
            right: 0,
            top: 0,
            bottom: 0,
            width: Ti.UI.SIZE
          });

            var button_done_label = Ti.UI.createLabel({
              text: "Done",
              left: 10,
              right: 15,
              width: Ti.UI.SIZE,
              font: {
                fontSize: 15,
                fontWeight: "Bold"
              },
              opacity: 0.9,
              color: "#fff"
            });

            button_done.add(button_done_label);

            button_done.addEventListener("click", function(){
              hidePopup();
            });

          nav.add(nav_title);
          nav.add(button_back);
          nav.add(button_done);

        var preferences_table = self.createPreferencesTable({switchTintColor: opts.switchTintColor});
        preferences_table.top = 50;

        second_view.add(preferences_table);
        second_view.add(nav);

      // Create the scrollable view

      var scrollable_view = Ti.UI.createScrollableView({
        top: 0,
        right: 0,
        left: 0,
        bottom: 0,
        views: [first_view, second_view],
        showPagingControl: false
      });

      scrollable_view.addEventListener("scrollend", function(e){
        if (e.currentPage == 1){
          preferences_table.loadPreferences();
        }
      });

      popup.add(scrollable_view)

      overlay.add(popup);

      popup.animate({
        opacity: 1.0,
        transform: Ti.UI.create2DMatrix().scale(1.0),
        duration: 150
      }, function(e){

      });
    };

    function hidePopup(){
      if(!popup) return;

      popup.animate({
        opacity: 0.0,
        transform: Ti.UI.create2DMatrix().scale(.75),
        duration: 100
      }, function(){
        overlay.remove(popup);
        popup = null;

        overlay.animate({
          opacity: 0.0,
          duration: 100
        }, function(e){
          win.remove(overlay);
          overlay = null;

          win.close();
        });
      });
    };

    win.addEventListener("open", function(e){
      init();
    });

    win.open();
  }

  //
  // Verify we can push to them
  //

  self.verifyPushEnabled = function(){
    if(self.current.device_token) return;

    // They can't actually get push's yet... so ask them...

    self.registerForPush();
  }

  //
  // Registerring for push
  //

  self.registerForPush = function(button, callback){
    Ti.API.info('Ti.Platform.name.toLowerCase(): '+Ti.Platform.name.toLowerCase());

    if(Ti.Platform.name.toLowerCase() == "android") return;

    //Check if the device is running iOS 8 or later
    Ti.API.info('Ti.Platform.version.indexOf("7."): '+Ti.Platform.version.indexOf("7."));

    if (Ti.Platform.version.indexOf("7.") == -1) {
      Ti.API.debug("[THQ] Registerring on iOS 8+");
      // Wait for user preferences to be registered before registering for push notifications
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
  // Create a Preferences Window
  //

  self.createPreferencesWindow = function(opts){
    var opts = opts || {};

    var win = Ti.UI.createWindow({
      title: opts.title || "Notifications",
      barColor: (opts.barColor || "#405F99"),
      navTintColor: (opts.tintColor || "#fff"),
      tintColor: (opts.tintColor || "#fff"),
      backgroundColor: (opts.backgroundColor || "#fff"),
      containingTab: opts.containingTab,
      titleAttributes: {
        color: (opts.tintColor || "#fff"),
        font: {
          fontSize: 17,
          fontWeight: "Bold"
        }
      }
    });

    win.table = self.createPreferencesTable({switchTintColor: opts.switchTintColor});

    win.addEventListener("open", function(e){
      win.table.loadPreferences();
    });

    win.add(win.table);

    return win;
  }

  //
  // Create a preferences table
  //

  self.createPreferencesTable = function(opts){
    var table = Ti.UI.createTableView({
      loaded: false,
      backgroundColor: "#fafafa",
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
      // tableSeparatorInsets: {
      //   left: 0,
      //   right: 0
      // },
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

      table.setData([loading_row]);

    table.loadPreferences = function(){
      if(table.loaded) return;
      table.loaded = true;

      self.getPreferences(function(response){
        var sections = [];
        var categories = response;

        for(var i=0;i<categories.length;i++){
          var category = categories[i];
          Ti.API.debug("[THQ] category: "+JSON.stringify(category))
          var preferences = category.preferences;

          var header_view = Ti.UI.createView({
            height: 50,
            backgroundColor: "#fafafa"
          });

            header_view.label = Ti.UI.createLabel({
              text: category.name,
              left: 15,
              bottom: 10,
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
            title: category.name,
            headerView: header_view,
            footerView: Ti.UI.createView({height: 1, backgroundColor: "#e2e2e2"})
          });

          for(var ii=0;ii<preferences.length;ii++){
            var preference = preferences[ii];
            Ti.API.debug("[THQ] preference: "+JSON.stringify(preference))

            var row = Ti.UI.createTableViewRow({
              height: 60,
              font: {
                fontSize: 14,
                fontWeight: "Bold"
              },
              color: "#424242",
              backgroundColor: "#fff",
              title: preference.name
            });

            row.switch = Ti.UI.createSwitch({
              right: 20,
              category: category.key,
              preference: preference.key,
              value: preference.enabled,
              onTintColor: (opts.switchTintColor || null)
            });

            row.addEventListener("change", function(e){
              Ti.API.debug("[THQ] Toggling "+e.source.category+":"+e.source.preference);

              if(e.value == false){
                // Disable it
                self.disablePreference(e.source.category, e.source.preference);
              } else {
                // Enable it!
                self.enablePreference(e.source.category, e.source.preference);
              }
            });

            row.add(row.switch);
            section.add(row);
          }

          sections.push(section);
        };

        table.setData(sections);
      });
    }

    return table;
  }

  //
  // Sending/Getting/Updating methods
  //

  self.getAccessToken = function(successCallback, errorCallback) {
    if (self.current.access_token && self.current.access_token_expires_at) {
      var now = new Date();
      var expires_at = new Date(parseInt(self.current.access_token_expires_at));

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

})();
