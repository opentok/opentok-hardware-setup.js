/*global describe, beforeEach, it, expect, createOpentokHardwareSetupComponent, spyOn, jasmine */

describe('opentok.js hardware setup component', function() {

  beforeEach(function() {
    window.OT = { getDevices: function() {}, initPublisher: function() {} };
  });

  describe('createOpentokHardwareSetupComponent', function() {
    describe('errors', function() {

      it('throws if no completion handler is given', function() {

        expect(function() {
          createOpentokHardwareSetupComponent();
        }).toThrowError('A completion handler is required when ' +
          'calling createOpentokHardwareSetupComponent');

      });

      it('callsback with an error if no element and no options are provided', function(done) {

        createOpentokHardwareSetupComponent(null, function(err) {
          expect(err).toEqual(new Error('No element provided to place component'));
          done();
        });

      });

      it('callsback with an error if no element is provided', function(done) {

        createOpentokHardwareSetupComponent(null, {}, function(err) {
          expect(err).toEqual(new Error('No element provided to place component'));
          done();
        });

      });

    });

    describe('insertMode', function() {

      beforeEach(function() {
        spyOn(window, 'authenticateForDeviceLabels');
      });

      it('defaults to replace', function() {

        var domElement = document.createElement('div');
        domElement.innerHTML = 'testing content';
        createOpentokHardwareSetupComponent(domElement, function() {});
        expect(window.authenticateForDeviceLabels).toHaveBeenCalled();
        expect(domElement.innerHTML).not.toEqual('testing content');
        expect(domElement.className).toEqual('opentok-hardware-setup ' +
          'opentok-hardware-setup-loading');

      });

      it('inserts before', function() {

        var domElement = document.createElement('div'),
            child = document.createElement('div');
        domElement.appendChild(child);
        child.innerHTML = 'testing content';
        createOpentokHardwareSetupComponent(child, { insertMode: 'before' }, function() {});
        expect(window.authenticateForDeviceLabels).toHaveBeenCalled();
        expect(child.innerHTML).toEqual('testing content');
        expect(child.previousSibling).not.toEqual(undefined);
        expect(child.previousSibling).not.toEqual(null);
        expect(child.previousSibling.className).toEqual('opentok-hardware-setup ' +
          'opentok-hardware-setup-loading');

      });

      it('inserts after', function() {

        var domElement = document.createElement('div'),
            child = document.createElement('div');
        domElement.appendChild(child);
        child.innerHTML = 'testing content';
        createOpentokHardwareSetupComponent(child, { insertMode: 'after' }, function() {});
        expect(window.authenticateForDeviceLabels).toHaveBeenCalled();
        expect(child.innerHTML).toEqual('testing content');
        expect(child.nextSibling).not.toEqual(undefined);
        expect(child.nextSibling).not.toEqual(null);
        expect(child.nextSibling.className).toEqual('opentok-hardware-setup ' +
          'opentok-hardware-setup-loading');

      });

      it('appends', function() {

        var domElement = document.createElement('div'),
            child = document.createElement('div');
        domElement.appendChild(child);
        child.innerHTML = 'testing content';
        createOpentokHardwareSetupComponent(domElement, { insertMode: 'append' }, function() {});
        expect(window.authenticateForDeviceLabels).toHaveBeenCalled();
        expect(child.innerHTML).toEqual('testing content');
        expect(child.nextSibling).not.toEqual(undefined);
        expect(child.nextSibling).not.toEqual(null);
        expect(child.nextSibling.className).toEqual('opentok-hardware-setup ' +
          'opentok-hardware-setup-loading');

      });

      it('replaces', function() {

        var domElement = document.createElement('div');
        domElement.innerHTML = 'testing content';
        createOpentokHardwareSetupComponent(domElement, { insertMode: 'replace' }, function() {});
        expect(window.authenticateForDeviceLabels).toHaveBeenCalled();
        expect(domElement.innerHTML).not.toEqual('testing content');
        expect(domElement.className).toEqual('opentok-hardware-setup ' +
          'opentok-hardware-setup-loading');

      });

    });

    describe('authenticateForDeviceLabels', function() {

      it('calls authenticateForDeviceLabels', function() {
        
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

    });


    it('creates device pickers', function() {

      spyOn(window, 'authenticateForDeviceLabels')
        .and.callFake(function(cb) { cb(); });

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
        defaultDevice: jasmine.any(String)
      }, jasmine.any(Function));

      expect(window.createDevicePickerController).toHaveBeenCalledWith({
        selectTag: jasmine.any(Node),
        previewTag: jasmine.any(Node),
        mode: 'audioSource',
        defaultDevice: jasmine.any(String)
      }, jasmine.any(Function));

      expect(microphone.setLoading).toHaveBeenCalled();
      expect(camera.setLoading).toHaveBeenCalled();

    });

    describe('getDevices', function() {

      it('calls the completion handler with an error if getDevices ' +
        'returns an error', function() {

        spyOn(window, 'authenticateForDeviceLabels')
          .and.callFake(function(cb) { cb(); });

        spyOn(window, 'createDevicePickerController')
        .and.callFake(function(opts) {
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
          .and.callFake(function(cb) { cb(); });

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

        var error = new Error('getDevices error');

        spyOn(OT, 'getDevices')
          .and.callFake(function(cb) {
            cb(undefined, [
              { kind: 'videoInput', id: 1 },
              { kind: 'videoInput', id: 2 },
              { kind: 'audioInput', id: 1 },
              { kind: 'audioInput', id: 2 },
              { kind: 'audioInput', id: 3 }
            ]);
          });

        var completionHandler = jasmine.createSpy('completionHandler');

        var domElement = document.createElement('div');
        var component = createOpentokHardwareSetupComponent(domElement, completionHandler);

        expect(completionHandler).toHaveBeenCalledWith(undefined, component);

        expect(camera.setDeviceList).toHaveBeenCalledWith(jasmine.any(Array));
        expect(camera.devices).toEqual([
              { kind: 'videoInput', id: 1 },
              { kind: 'videoInput', id: 2 }
        ]);
        expect(microphone.setDeviceList).toHaveBeenCalledWith(jasmine.any(Array));
        expect(microphone.devices).toEqual([
              { kind: 'audioInput', id: 1 },
              { kind: 'audioInput', id: 2 },
              { kind: 'audioInput', id: 3 }
        ]);

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
            .and.callFake(function(tag, options) {
              var obj = { on: function() {}, destroy: function() {} };
              return obj;
            });

          picker.setDeviceList([
            { kind: 'videoInput', label: 'Device 1', deviceId: 'DEVICE1' },
            { kind: 'videoInput', label: 'Device 2', deviceId: 'DEVICE2' }
          ]);

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
