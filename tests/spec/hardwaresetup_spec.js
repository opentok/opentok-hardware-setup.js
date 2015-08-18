/*global describe, beforeEach, it, expect, createOpentokHardwareSetupComponent, spyOn, jasmine */

describe('opentok.js hardware setup component', function() {

  beforeEach(function() {
    window.OT = {
      getDevices: function() {},
      initPublisher: function() {}
    };
    window.OTPlugin = {
      getUserMedia: function() {}
    };
  });

  describe('createOpentokHardwareSetupComponent', function() {
    describe('errors', function() {

      it('throws if no completion handler is given', function() {

        expect(function() {
          createOpentokHardwareSetupComponent();
        }).toThrowError('A completion handler is required when ' +
          'calling createOpentokHardwareSetupComponent');

      });

      it('calls back with an error if no element and no options are provided', function(done) {

        createOpentokHardwareSetupComponent(null, function(err) {
          expect(err).toEqual(new Error('No element provided to place component'));
          done();
        });

      });

      it('calls back with an error if no element is provided', function(done) {

        createOpentokHardwareSetupComponent(null, {}, function(err) {
          expect(err).toEqual(new Error('No element provided to place component'));
          done();
        });

      });

      it('calls back with an error if element is not found', function(done) {

        createOpentokHardwareSetupComponent('elementThatDoesntExist', {}, function(err) {
          expect(err).toEqual(new Error('No element provided to place component'));
          done();
        });

      });

    });

    describe('insertMode', function() {

      beforeEach(function() {
        spyOn(window, 'authenticateForDeviceLabels');
      });

      var createSubDiv = function(innerHTML) {
        var container = document.createElement('div');
        var element = document.createElement('div');
        container.appendChild(element);

        if (innerHTML) {
          element.innerHTML = innerHTML;
        }

        return element;
      };

      var checkElementSetupCorrectly = function(el) {
        expect(el).not.toEqual(undefined);
        expect(el).not.toEqual(null);
        expect(el.className).toEqual('opentok-hardware-setup opentok-hardware-setup-loading');
      };

      it('defaults to replace', function() {

        var element = createSubDiv('testing content');
        createOpentokHardwareSetupComponent(element, function() {});
        expect(window.authenticateForDeviceLabels).toHaveBeenCalled();
        expect(element.innerHTML).not.toEqual('testing content');
        checkElementSetupCorrectly(element);

      });

      it('works with id instead of element', function() {

        var element = createSubDiv('testing content');
        element.setAttribute('id', 'elementInWorksWithIdInsteadOfElement');
        document.body.appendChild(element.parentNode);

        createOpentokHardwareSetupComponent('elementInWorksWithIdInsteadOfElement', function() {});

        expect(window.authenticateForDeviceLabels).toHaveBeenCalled();
        expect(element.innerHTML).not.toEqual('testing content');
        checkElementSetupCorrectly(element);
        document.body.removeChild(element.parentNode);

      });

      it('inserts before', function() {

        var element = createSubDiv('testing content');
        createOpentokHardwareSetupComponent(element, {
          insertMode: 'before'
        }, function() {});
        expect(window.authenticateForDeviceLabels).toHaveBeenCalled();
        expect(element.innerHTML).toEqual('testing content');
        checkElementSetupCorrectly(element.previousSibling);

      });

      it('inserts after', function() {

        var element = createSubDiv('testing content');
        createOpentokHardwareSetupComponent(element, {
          insertMode: 'after'
        }, function() {});
        expect(window.authenticateForDeviceLabels).toHaveBeenCalled();
        expect(element.innerHTML).toEqual('testing content');
        checkElementSetupCorrectly(element.nextSibling);

      });

      it('appends', function() {

        var element = createSubDiv('testing content');
        createOpentokHardwareSetupComponent(element.parentNode, {
            insertMode: 'append'
          },
          function() {});
        expect(window.authenticateForDeviceLabels).toHaveBeenCalled();
        expect(element.innerHTML).toEqual('testing content');
        checkElementSetupCorrectly(element.nextSibling);

      });

      it('replaces', function() {

        var element = createSubDiv('testing content');
        createOpentokHardwareSetupComponent(element, {
          insertMode: 'replace'
        }, function() {});
        expect(window.authenticateForDeviceLabels).toHaveBeenCalled();
        expect(element.innerHTML).not.toEqual('testing content');
        checkElementSetupCorrectly(element);

      });

    });

    describe('destroy', function() {
      var camera, microphone;
      beforeEach(function() {
        spyOn(window, 'createDevicePickerController').and.callFake(function() {
          if (!camera) {
            camera = jasmine.createSpyObj('camera', ['cleanup', 'setLoading']);
            return camera;
          } else {
            microphone = jasmine.createSpyObj('microphone', ['cleanup', 'setLoading']);
            return microphone;
          }
        });
        spyOn(window, 'authenticateForDeviceLabels').and.callFake(function(cb) {
          cb();
        });
      });

      it('calls cleanup on the camera and microphone', function() {
        var domElement = document.createElement('div');
        var component = createOpentokHardwareSetupComponent(domElement, function() {});
        component.destroy();
        expect(camera).toBeDefined();
        expect(microphone).toBeDefined();
        expect(camera.cleanup).toHaveBeenCalled();
        expect(microphone.cleanup).toHaveBeenCalled();
      });
    });

    describe('authenticateForDeviceLabels', function() {

      it('gets called with a callback function', function() {

        var authenticateCallback;
        spyOn(window, 'authenticateForDeviceLabels')
          .and.callFake(function(cb) {
            authenticateCallback = cb;
          });

        var domElement = document.createElement('div');
        createOpentokHardwareSetupComponent(domElement, function() {});
        expect(window.authenticateForDeviceLabels).toHaveBeenCalled();
        expect(authenticateCallback).toEqual(jasmine.any(Function));

      });

      it('calls the completion handler with an error if an authenticateForDeviceLabels ' +
        'returns an error', function() {

          var error = new Error('authenticateForDeviceLabels error');
          spyOn(window, 'authenticateForDeviceLabels')
            .and.callFake(function(cb) {
              cb(error);
            });

          var completionHandler = jasmine.createSpy('completionHandler');

          var domElement = document.createElement('div');
          createOpentokHardwareSetupComponent(domElement, completionHandler);
          expect(window.authenticateForDeviceLabels).toHaveBeenCalled();
          expect(completionHandler).toHaveBeenCalledWith(error);
        });

      it('calls getDevices', function() {
        spyOn(OT, 'getDevices').and.callThrough();
        spyOn(window, 'authenticateForDeviceLabels').and.callThrough();
        var domElement = document.createElement('div');
        createOpentokHardwareSetupComponent(domElement, function() {});
        expect(window.authenticateForDeviceLabels).toHaveBeenCalled();
        expect(OT.getDevices).toHaveBeenCalled();
      });

      it('passes through getDevices errors', function(done) {
        var mockError = new Error('Mock Error');
        spyOn(OT, 'getDevices').and.callFake(function(cb) {
          cb(mockError);
        });
        var domElement = document.createElement('div');
        createOpentokHardwareSetupComponent(domElement, function(err) {
          expect(err).toBe(mockError);
          done();
        });
      });

      it('calls the completion handler with an error for no audio or video devices',
        function(done) {
          spyOn(OT, 'getDevices').and.callFake(function(cb) {
            cb(undefined, []);
          });
          var domElement = document.createElement('div');
          createOpentokHardwareSetupComponent(domElement, function(err) {
            expect(err).toBeDefined();
            expect(err.message).toBe('There are no audio or video devices available');
            done();
          });
        });

      describe('on http: with audio and video devices', function() {
        beforeEach(function() {
          spyOn(window, 'getWindowLocationProtocol').and.callFake(function() {
            return 'http:';
          });
          spyOn(OT, 'initPublisher')
            .and.callFake(function() {
              var obj = {
                on: function() {},
                destroy: function() {}
              };
              return obj;
            });
          spyOn(OT, 'getDevices').and.callFake(function(cb) {
            cb(undefined, [{
              kind: 'audioInput',
              deviceId: 'mockDeviceId'
            }, {
              kind: 'videoInput',
              deviceId: 'mockDeviceId'
            }]);
          });
        });

        it('calls back with no error',
          function(done) {
            var domElement = document.createElement('div');
            createOpentokHardwareSetupComponent(domElement, function(err) {
              expect(err).not.toBeDefined();
              done();
            });
          });
      });

      describe('on https:', function() {
        beforeEach(function() {
          spyOn(window, 'getWindowLocationProtocol').and.callFake(function() {
            return 'https:';
          });
          spyOn(OT, 'initPublisher')
            .and.callFake(function() {
              var obj = {
                on: function() {},
                destroy: function() {}
              };
              return obj;
            });
        });

        describe('with audio and video devices', function() {
          beforeEach(function() {
            spyOn(OT, 'getDevices').and.callFake(function(cb) {
              cb(undefined, [{
                kind: 'audioInput',
                deviceId: 'mockDeviceId'
              }, {
                kind: 'videoInput',
                deviceId: 'mockDeviceId'
              }]);
            });
          });

          it('calls getUserMedia with the right constraints', function(done) {
            window.getUserMedia = function(constraints) {
              expect(constraints.audio).toBe(true);
              expect(constraints.video).toBe(true);
              done();
            };
            var domElement = document.createElement('div');
            createOpentokHardwareSetupComponent(domElement, function() {});
          });

          it('calls the completion handler with an error for no getUserMedia function',
            function(done) {
              window.getUserMedia = undefined;

              spyOn(window, 'authenticateForDeviceLabels').and.callThrough();
              var domElement = document.createElement('div');
              createOpentokHardwareSetupComponent(domElement, function(err) {
                expect(err).toBeDefined();
                expect(err.message).toBe('getUserMedia not supported in this browser');
                done();
              });
            });

          it('calls the completion handler with an error for getUserMedia errors', function(done) {
            window.getUserMedia = function(constraints, success, failure) {
              failure({
                name: 'PermissionDeniedError'
              });
            };
            spyOn(window, 'authenticateForDeviceLabels').and.callThrough();
            var domElement = document.createElement('div');
            createOpentokHardwareSetupComponent(domElement, function(err) {
              expect(err).toBeDefined();
              expect(err.message).toBe('End-user denied permission to hardware devices');
              done();
            });
          });

          it('calls stream.stop and the callback when getUserMedia completes', function(done) {
            var mockStream = jasmine.createSpyObj('stream', ['stop']);
            window.getUserMedia = function(constraints, success, failure) {
              success(mockStream);
            };
            spyOn(window, 'authenticateForDeviceLabels').and.callThrough();
            var domElement = document.createElement('div');
            createOpentokHardwareSetupComponent(domElement, function(err) {
              expect(err).not.toBeDefined();
              expect(mockStream.stop).toHaveBeenCalled();
              done();
            });
          });
        });

        describe('with only audio devices', function() {
          beforeEach(function() {
            spyOn(OT, 'getDevices').and.callFake(function(cb) {
              cb(undefined, [{
                kind: 'audioInput',
                deviceId: 'mockDeviceId'
              }]);
            });
          });

          it('calls getUserMedia with the right constraints', function(done) {
            window.getUserMedia = function(constraints) {
              expect(constraints.audio).toBe(true);
              expect(constraints.video).toBe(false);
              done();
            };
            var domElement = document.createElement('div');
            createOpentokHardwareSetupComponent(domElement, function() {});
          });
        });
      });

    });



    it('creates device pickers', function() {

      spyOn(window, 'authenticateForDeviceLabels')
        .and.callFake(function(cb) {
          cb();
        });

      var camera, microphone;

      spyOn(window, 'createDevicePickerController')
        .and.callFake(function(opts) {
          var fake = {
            setLoading: jasmine.createSpy('createDevicePickerController.setLoading')
          };
          if (opts.mode === 'videoSource') {
            camera = fake;
          } else {
            microphone = fake;
          }
          return fake;
        });

      spyOn(OT, 'getDevices');

      var domElement = document.createElement('div');
      createOpentokHardwareSetupComponent(domElement, function() {});

      expect(window.createDevicePickerController).toHaveBeenCalledWith({
        selectTag: jasmine.any(Node),
        previewTag: jasmine.any(Node),
        mode: 'videoSource',
        defaultDevice: null
      }, jasmine.any(Function));

      expect(window.createDevicePickerController).toHaveBeenCalledWith({
        selectTag: jasmine.any(Node),
        previewTag: jasmine.any(Node),
        mode: 'audioSource',
        defaultDevice: null
      }, jasmine.any(Function));

      expect(microphone.setLoading).toHaveBeenCalled();
      expect(camera.setLoading).toHaveBeenCalled();

    });

    describe('getDevices', function() {

      it('calls the completion handler with an error if getDevices ' +
        'returns an error', function() {

          spyOn(window, 'authenticateForDeviceLabels')
            .and.callFake(function(cb) {
              cb();
            });

          spyOn(window, 'createDevicePickerController')
            .and.callFake(function() {
              return {
                setLoading: function() {}
              };
            });

          var error = new Error('getDevices error');

          spyOn(OT, 'getDevices')
            .and.callFake(function(cb) {
              cb(error);
            });

          var completionHandler = jasmine.createSpy('completionHandler');

          var domElement = document.createElement('div');
          createOpentokHardwareSetupComponent(domElement, completionHandler);

          expect(completionHandler).toHaveBeenCalledWith(error);

        });

      it('calls picker.setDeviceList', function() {

        spyOn(window, 'authenticateForDeviceLabels')
          .and.callFake(function(cb) {
            cb();
          });

        var camera, microphone;
        spyOn(window, 'createDevicePickerController')
          .and.callFake(function(opts) {
            var fake = {
              setLoading: function() {},
              setDeviceList: jasmine.createSpy('createDevicePickerController.setDeviceList')
                .and.callFake(function(devices) {
                  fake.devices = devices;
                })
            };
            if (opts.mode === 'videoSource') {
              camera = fake;
            } else {
              microphone = fake;
            }
            return fake;
          });

        spyOn(OT, 'getDevices')
          .and.callFake(function(cb) {
            cb(undefined, [{
              kind: 'videoInput',
              id: 1
            }, {
              kind: 'videoInput',
              id: 2
            }, {
              kind: 'audioInput',
              id: 1
            }, {
              kind: 'audioInput',
              id: 2
            }, {
              kind: 'audioInput',
              id: 3
            }]);
          });

        var completionHandler = jasmine.createSpy('completionHandler');

        var domElement = document.createElement('div');
        var component = createOpentokHardwareSetupComponent(domElement, completionHandler);

        expect(completionHandler).toHaveBeenCalledWith(undefined, component);

        expect(camera.setDeviceList).toHaveBeenCalledWith(jasmine.any(Array));
        expect(camera.devices).toEqual([{
          kind: 'videoInput',
          id: 1
        }, {
          kind: 'videoInput',
          id: 2
        }]);
        expect(microphone.setDeviceList).toHaveBeenCalledWith(jasmine.any(Array));
        expect(microphone.devices).toEqual([{
          kind: 'audioInput',
          id: 1
        }, {
          kind: 'audioInput',
          id: 2
        }, {
          kind: 'audioInput',
          id: 3
        }]);
      });

    });

  });

  describe('createDevicePickerController', function() {

    it('returns an object', function() {

      var picker = createDevicePickerController({
        selectTag: document.createElement('select'),
        previewTag: document.createElement('div'),
        mode: 'videoSource',
        defaultDevice: undefined
      }, function() {});

      expect(picker).toEqual({
        cleanup: jasmine.any(Function),
        setDeviceList: jasmine.any(Function),
        setLoading: jasmine.any(Function)
      });

    });

    describe('setLoading', function() {

      it('disables the seletor', function() {

        var select = document.createElement('select');
        var picker = createDevicePickerController({
          selectTag: select,
          previewTag: document.createElement('div'),
          mode: 'videoSource',
          defaultDevice: undefined
        }, function() {});

        picker.setLoading();

        expect(select.value).toEqual('Loading...');
        expect(select.disabled).toBe(true);

      });

    });

    describe('setDeviceList', function() {

      describe('with no devices', function() {

        it('disables the selector', function() {

          var select = document.createElement('select');
          var picker = createDevicePickerController({
            selectTag: select,
            previewTag: document.createElement('div'),
            mode: 'videoSource',
            defaultDevice: undefined
          }, function() {});

          picker.setDeviceList([]);

          expect(select.value).toEqual('No devices');
          expect(select.disabled).toBe(true);

        });

      });

      describe('with devices', function() {

        var select, preview, picker;

        beforeEach(function() {

          select = document.createElement('select');
          preview = document.createElement('div');
          picker = createDevicePickerController({
            selectTag: select,
            previewTag: preview,
            mode: 'videoSource',
            defaultDevice: undefined
          }, function() {});

          spyOn(OT, 'initPublisher')
            .and.callFake(function() {
              var obj = {
                on: function() {},
                destroy: function() {}
              };
              return obj;
            });

          picker.setDeviceList([{
            kind: 'videoInput',
            label: 'Device 1',
            deviceId: 'DEVICE1'
          }, {
            kind: 'videoInput',
            label: 'Device 2',
            deviceId: 'DEVICE2'
          }]);

        });

        it('populates the select box if there are devices', function() {

          expect(select.value).toEqual('DEVICE1');
          expect(select.options.length).toEqual(2);
          expect(select.options[0].value).toEqual('DEVICE1');
          expect(select.options[0].firstChild.nodeValue).toEqual('Device 1');
          expect(select.options[1].value).toEqual('DEVICE2');
          expect(select.options[1].firstChild.nodeValue).toEqual('Device 2');
          expect(select.disabled).toBe(false);

        });

        it('initializes a publisher for the first device', function() {

          expect(OT.initPublisher).toHaveBeenCalledWith(preview, {
            insertMode: 'append',
            name: 'Device 1',
            audioSource: null,
            videoSource: 'DEVICE1',
            width: 220,
            height: 170,
            fitMode: 'cover',
            style: {
              audioLevelDisplayMode: 'off'
            },
            showControls: false
          });

        });

      });

    });

  });

});
