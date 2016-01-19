'use strict';

var gumNamesToMessages = {
  PermissionDeniedError: 'End-user denied permission to hardware devices',
  PermissionDismissedError: 'End-user dismissed permission to hardware devices',
  NotSupportedError: 'A constraint specified is not supported by the browser.',
  ConstraintNotSatisfiedError: 'It\'s not possible to satisfy one or more constraints ' +
    'passed into the getUserMedia function',
  OverconstrainedError: 'Due to changes in the environment, one or more mandatory ' +
    'constraints can no longer be satisfied.',
  NoDevicesFoundError: 'No voice or video input devices are available on this machine.',
  HardwareUnavailableError: 'The selected voice or video devices are unavailable. Verify ' +
    'that the chosen devices are not in use by another application.'
};

var isArray = typeof Array.isArray && Array.isArray || function(arry) {
  return Object.prototype.toString.call(arry) === '[object Array]';
};

var each = Array.prototype.forEach || function(iter, ctx) {
  for(var idx = 0, count = this.length || 0; idx < count; ++idx) {
    if(idx in this) {
      iter.call(ctx, this[idx], idx);
    }
  }
};

var addClass = function(el, className) {
  if (el.classList) {
    el.classList.add(className);
  } else {
    el.className += ' ' + className;
  }
};

var removeClass = function(el, className) {
  if (el.classList) {
    el.classList.remove(className);
  } else {
    el.className = el.className.replace(
      new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' '
    );
  }
};

var setPref = function(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (err) {}
};

var getPref = function(key) {
  try {
    return localStorage.getItem(key);
  } catch (err) {}
  return undefined;
};

var createElement = function(nodeName, attributes, children, doc) {
  var element = (doc || document).createElement(nodeName);

  if (attributes) {
    for (var name in attributes) {
      if (typeof(attributes[name]) === 'object') {
        if (!element[name]) element[name] = {};

        var subAttrs = attributes[name];
        for (var n in subAttrs) {
          element[name][n] = subAttrs[n];
        }
      } else if (name === 'className') {
        element.className = attributes[name];
      } else {
        element.setAttribute(name, attributes[name]);
      }
    }
  }

  var setChildren = function(child) {
    if(typeof child === 'string') {
      element.innerHTML = element.innerHTML + child;
    } else {
      element.appendChild(child);
    }
  };

  if(isArray(children)) {
    each.call(children, setChildren);
  } else if(children) {
    setChildren(children);
  }

  return element;
};

var createDevicePickerController = function(opts, changeHandler) {
  var _devicePicker = {},
      destroyExistingPublisher,
      publisher,
      devicesById;

  var onChange = function onChange() {
    destroyExistingPublisher();

    var settings;

    _devicePicker.pickedDevice = devicesById[opts.selectTag.value];

    if(!_devicePicker.pickedDevice) {
      return;
    }

    settings = {
      insertMode: 'append',
      name: _devicePicker.pickedDevice.label,
      audioSource: null,
      videoSource: null,
      width: 220,
      height: 170,
      fitMode: 'cover',
      style: {
        audioLevelDisplayMode: 'off'
      },
      showControls: false
    };

    settings[opts.mode] = _devicePicker.pickedDevice.deviceId;

    var widgetTag = opts.previewTag,
        audioDisplayTag, audioDisplayParent;

    if (opts.mode === 'audioSource') {
      opts.previewTag.innerHTML = '';

      audioDisplayTag = createElement('div', {
        className: 'opentok-hardware-setup-activity-fg',
        style: 'width: 0px;'
      });

      audioDisplayParent = createElement('div', {
        className: 'opentok-hardware-setup-activity-bg'
      }, audioDisplayTag);

      widgetTag = createElement('div', { style: 'display: none;' });

      opts.previewTag.appendChild(widgetTag);
      opts.previewTag.appendChild(audioDisplayParent);
    }

    var pub;
    if (typeof opts.publisherHandler === 'function') {
      pub = OT.initPublisher(widgetTag, settings, opts.publisherHandler);
    } else {
      pub = OT.initPublisher(widgetTag, settings);
    }

    pub.on({
      accessAllowed: function() {
        if (typeof changeHandler === 'function') {
          changeHandler(_devicePicker);
        }
      }
    });

    if (typeof opts.accessDeniedHandler === 'function') {
      pub.on({ accessDenied: opts.accessDeniedHandler });
    }

    var movingAvg = null;

    if (opts.mode === 'audioSource') {

      pub.on('audioLevelUpdated', function(event) {
        if (movingAvg === null || movingAvg <= event.audioLevel) {
          movingAvg = event.audioLevel;
        } else {
          movingAvg = 0.7 * movingAvg + 0.3 * event.audioLevel;
        }

        // 1.5 scaling to map the -30 - 0 dBm range to [0,1]
        var logLevel = (Math.log(movingAvg) / Math.LN10) / 1.5 + 1;
        logLevel = Math.min(Math.max(logLevel, 0), 1);

        var tagCount = audioDisplayTag.parentNode.offsetWidth / 10;
        audioDisplayTag.style.width = (Math.ceil(tagCount * logLevel) * 10) + 'px';
        // audioDisplayTag.innerHTML = (logLevel * 100).toFixed(0);

        if (typeof opts.audioLevelUpdatedHandler === 'function') {
          opts.audioLevelUpdatedHandler(event);
        }
      });
    }

    publisher = pub;
  };

  _devicePicker.cleanup = destroyExistingPublisher = function() {
    if(publisher) {
      publisher.destroy();
      publisher = void 0;
    }
  };

  var disableSelector = function (opt, str) {
    opt.innerHTML = '';
    opt.appendChild(createElement('option', {}, str));
    opt.setAttribute('disabled', '');
  };

  var deviceLabel = function(device) {
    if (device.label) {
      return device.label;
    }
    return (opts.mode !== 'audioSource' && 'Camera' || 'Mic') +
      ' (' + device.deviceId.substring(0, 8) + ')';
  };

  var addDevice = function (device) {
    devicesById[device.deviceId] = device;
    return createElement('option', { value: device.deviceId }, deviceLabel(device));
  };

  _devicePicker.setDeviceList = function (devices) {
    opts.selectTag.innerHTML = '';
    devicesById = {};
    if(devices.length > 0) {
      devices.map(addDevice).map(function(tag) {
        opts.selectTag.appendChild(tag);
      });
      opts.selectTag.removeAttribute('disabled');
    } else {
      disableSelector(opts.selectTag, 'No devices');
    }
    if (opts.defaultDevice) {
      opts.selectTag.value = opts.defaultDevice;
    }
    onChange();
  };

  _devicePicker.setLoading = function() {
    disableSelector(opts.selectTag, 'Loading...');
  };

  if (opts.selectTag.addEventListener) {
    opts.selectTag.addEventListener('change', onChange, false);
  } else if (opts.selectTag.attachEvent) {
    opts.selectTag.attachEvent('onchange', onChange);
  } else {
    opts.selectTag.onchange = onChange();
  }

  return _devicePicker;
};

var getWindowLocationProtocol = function() {
  return (typeof window !== 'undefined') ? window.location.protocol : null;
};

var shouldGetDevices = function(callback) {
  OT.getDevices(function(error, devices) {
    if (error) {
      callback(error);
      return;
    }
    callback(undefined, {
      audio: devices.some(function(device) {
        return device.kind === 'audioInput';
      }),
      video: devices.some(function(device) {
        return device.kind === 'videoInput';
      })
    });
  });
};

var getUserMedia;
if (typeof window !== 'undefined') {
  if (navigator.getUserMedia) {
    getUserMedia = navigator.getUserMedia.bind(navigator);
  } else if (navigator.mozGetUserMedia) {
    getUserMedia = navigator.mozGetUserMedia.bind(navigator);
  } else if (navigator.webkitGetUserMedia) {
    getUserMedia = navigator.webkitGetUserMedia.bind(navigator);
  } else if (window.OTPlugin && window.OTPlugin.getUserMedia) {
    getUserMedia = window.OTPlugin.getUserMedia.bind(window.OTPlugin);
  }
}

var authenticateForDeviceLabels = function(callback) {
  shouldGetDevices(function(error, constraints) {
    if (error) {
      callback(error);
    } else {
      if (constraints.video === false && constraints.audio === false) {
        callback(new Error('There are no audio or video devices available'));
      } else {
        if (getWindowLocationProtocol() === 'http:') {
          callback();
        } else {
          if (!getUserMedia) {
            return callback(new Error('getUserMedia not supported in this browser'));
          }
          getUserMedia(constraints, function(stream) {
            if (window.MediaStreamTrack && window.MediaStreamTrack.prototype.stop) {
              var tracks = stream.getTracks();
              tracks.forEach(function(track) {
                track.stop();
              });
            } else if (stream.stop) {
              // older spec
              stream.stop();
            }
            callback();
          }, function(error) {
            var err = new Error(gumNamesToMessages[error.name]);
            err.name = error.name;
            callback(err);
          });
        }
      }
    }
  });
};

var createOpentokHardwareSetupComponent = function createOpentokHardwareSetupComponent(targetElement, options, callback) {

  if (typeof targetElement === 'string') {
    targetElement = document.getElementById(targetElement);
  }

  var _hardwareSetup = {},
      _options,
      state = 'getDevices',
      camera,
      microphone,
      camSelector,
      camPreview,
      micSelector,
      micPreview,
      container;

  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  if (callback == null) {
    throw new Error('A completion handler is required when calling ' +
      'createOpentokHardwareSetupComponent');
  }

  _options = {
    insertMode: options.insertMode || 'replace',
    defaultAudioDevice: options.defaultAudioDevice || getPref('com.opentok.hardwaresetup.audio'),
    defaultVideoDevice: options.defaultVideoDevice || getPref('com.opentok.hardwaresetup.video')
  };

  _hardwareSetup.audioSource = function() {
    return microphone && microphone.pickedDevice;
  };

  _hardwareSetup.videoSource = function() {
    return camera && camera.pickedDevice;
  };

  _hardwareSetup.destroy = function() {
    if(state === 'destroyed') {
      return;
    }
    if(camera) {
      camera.cleanup();
    }
    if(microphone) {
      microphone.cleanup();
    }
    if(state === 'chooseDevices') {
      targetElement.parentNode.removeChild(targetElement);
    }
    state = 'destroyed';
  };

  if(!targetElement) {
    callback(new Error('No element provided to place component'));
    return;
  }

  camSelector = createElement('select', {}, '');
  camPreview = createElement('div', { className: 'opentok-hardware-setup-preview' }, '');
  micSelector = createElement('select', {}, '');
  micPreview = createElement('div', { className: 'opentok-hardware-setup-preview' }, '');

  container = createElement('div', {
    className: 'opentok-hardware-setup opentok-hardware-setup-loading'
  });

  var insertMode = _options.insertMode;
  if(insertMode !== 'replace') {
    if(insertMode === 'append') {
      targetElement.appendChild(container);
      targetElement = container;
    } else if(insertMode === 'before') {
      targetElement.parentNode.insertBefore(container, targetElement);
      targetElement = container;
    } else if(insertMode === 'after') {
      targetElement.parentNode.insertBefore(container, targetElement.nextSibling);
      targetElement = container;
    }
  } else {
    targetElement.innerHTML = '';
    addClass(targetElement, 'opentok-hardware-setup');
    if(!targetElement.getAttribute('id')) {
      targetElement.setAttribute('id', container.getAttribute('id'));
    }
    for(var key in container.style) {
      if (!container.style.hasOwnProperty(key)) { continue; }
      targetElement.style[key] = container.style[key];
    }
    while(container.childNodes.length > 0) {
      targetElement.appendChild(container.firstChild);
    }
  }

  addClass(targetElement, 'opentok-hardware-setup-loading');

  authenticateForDeviceLabels(function(err) {
    if (err) {
      callback(err);
    } else {

      camera = createDevicePickerController({
        selectTag: camSelector,
        previewTag: camPreview,
        mode: 'videoSource',
        defaultDevice: _options.defaultVideoDevice,
        publisherHandler: options.videoPublisherHandler,
        accessDeniedHandler: options.accessDeniedHandler
      }, function(controller) {
        setPref('com.opentok.hardwaresetup.video', controller.pickedDevice.deviceId);
      });

      microphone = createDevicePickerController({
        selectTag: micSelector,
        previewTag: micPreview,
        mode: 'audioSource',
        defaultDevice: _options.defaultAudioDevice,
        publisherHandler: options.audioPublisherHandler,
        accessDeniedHandler: options.accessDeniedHandler,
        audioLevelUpdatedHandler: options.audioLevelUpdatedHandler
      }, function(controller) {
        setPref('com.opentok.hardwaresetup.audio', controller.pickedDevice.deviceId);
      });

      camera.setLoading();
      microphone.setLoading();

      OT.getDevices(function(error, devices) {
        if (error) {
          callback(error);
          return;
        }

        if(state === 'destroyed') {
          return; // They destroyed us before we got the devices, bail.
        }

        removeClass(container, 'opentok-hardware-setup-loading');

        container.appendChild(
          createElement('div', { className: 'opentok-hardware-setup-camera' }, [
            createElement('div', { className: 'opentok-hardware-setup-label' }, 'Camera:'),
            createElement('div', { className: 'opentok-hardware-setup-selector' }, camSelector),
            camPreview
          ])
        );

        container.appendChild(createElement('div', { className: 'opentok-hardware-setup-mic' }, [
          createElement('div', { className: 'opentok-hardware-setup-label' }, 'Mic:'),
          createElement('div', { className: 'opentok-hardware-setup-selector' }, micSelector),
          micPreview
        ]));

        camera.setDeviceList(devices.filter(function(device) {
          return device.kind === 'videoInput';
        }));

        microphone.setDeviceList(devices.filter(function(device) {
          return device.kind === 'audioInput';
        }));

        state = 'chooseDevices';

        callback(undefined, _hardwareSetup);

      });

    }
  });

  return _hardwareSetup;

};

if (typeof exports !== 'undefined') {
  exports.createDevicePickerController = createDevicePickerController;
  exports.authenticateForDeviceLabels = authenticateForDeviceLabels;
  exports.createOpentokHardwareSetupComponent = createOpentokHardwareSetupComponent;
} else if (typeof window !== 'undefined') {
  window.createDevicePickerController = createDevicePickerController;
  window.authenticateForDeviceLabels = authenticateForDeviceLabels;
  window.createOpentokHardwareSetupComponent = createOpentokHardwareSetupComponent;
}
