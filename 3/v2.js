/*global angular, window, FileReader, URL, Uint8Array, Float32Array,
  parse_audio_metadata, requestAnimationFrame*/
(function() {
  // @constants

  var BIN_WIDTH = 3;
  var BARS_MARGIN_X = 7;
  var BARS_MARGIN_Y = 0;
  var BARS_N = 16; // должна быть степенью двойки для fft
  var BARS_M = 10;
  var EQS = [
    { name: 'обычный', a: 0, b: 0, c: 0 },
    { name: 'поп', a: 0, b: 10, c: 0, },
    { name: 'рок', a: 10, b: 0, c: 0 },
    { name: 'джаз', a: 0, b: 0, c: 10 },
    { name: 'классика', a: -20, b: 0, c: 0 },
    { name: 'под водой', a: 30, b: -10, c: -60 }
  ];

  // @utilities

  var debug = function () {
    console.log.apply (console, arguments);
  };

  var muteEvent = function (event) {
    event.preventDefault();
    event.stopPropagation();
  };

  var noescape = function (str) {
    return str
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'");
  };

  var canvasSetup = function (canvas) {
    var drawContext = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    var cw = canvas.width;
    var ch = canvas.height;

    return {
      canvas: canvas,
      drawContext: drawContext,
      cw: cw,
      ch: ch
    };
  };

  // @global init

  var AudioContext = window.AudioContext || window.webkitAudioContext;
  var audioContext = new AudioContext();

  // @angular starts

  var app = angular.module('player', ['ngAnimate']);

  app.controller('PlayerController', 
      ['$scope', function($scope) {
    var this_ = this;

    // @init

    var filterA = audioContext.createBiquadFilter ();
    var filterB = audioContext.createBiquadFilter ();
    var filterC = audioContext.createBiquadFilter ();
    filterA.type = 'peaking';
    filterB.type = 'peaking';
    filterC.type = 'peaking';
    filterA.frequency.value = 128;
    filterB.frequency.value = 1024;
    filterC.frequency.value = 8192;

    var analyser = audioContext.createAnalyser();
    analyser.fftSize = BARS_N * 2;
    filterA.connect (filterB);
    filterB.connect (filterC);
    filterC.connect (analyser);
    analyser.connect (audioContext.destination);

    // @data

    this.callbacks = {}; // для ясности все callback-и в одной структурке.
    this.mode = 'open-file'; // мутабельно; текущий режим
                             // 'open-file' | 'invalid' | 'normal' | 'loading'
    this.eq = 0; // мутабельно; номер текущего эквалайзера
    this.input = filterA; // alias для удобства
    this.filterA = filterA;
    this.filterB = filterB;
    this.filterC = filterC;
    this.analyser = analyser;
    this.fftArray = new Uint8Array (BARS_N);

    this.waveInfo = undefined; // информация о канвасе wave, иницализируется извне
    this.sliderInfo = undefined; // аналогично
    this.barsInfo = undefined; // аналогично

    this.normal = undefined; // состояние внутри режима normal
    this.loading = undefined; // состояние внутри режима loading

    // @methods

    /* isMode (mode)
     * eqName ()
     * waveClick (event)
     * callbacks.registerWaveCanvas (canvas)
     * callbacks.registerSliderCanvas (canvas)
     * callbacks.registerBarsCanvas (canvas)
     * eqInc ()
     * eqDec ()
     * playing ()
     * play ()
     * pause ()
     * stop ()
     * eject ()
     * confirmInvalid ()
     */

    this.isMode = function (mode) {
      return mode === this.mode;
    };

    this.eqName = function () {
      return EQS[this.eq].name;
    };

    this.waveClick = function (event) {
      if (this.mode !== 'normal') { return; }

      if (this.normal.src) {
        this._destroySrc ();
      }

      var x = event.offsetX || event.layerX;
      if (x >= 0) {
        this.normal.startPosition = x * this.normal.audio.pixelDelta;
        this._play();
      } else {
        debug ("invalid x:", x);
      }
    };

    this.eqInc = function () {
      this.eq = (this.eq + 1) % EQS.length;
      this._updateFilters();
    };

    this.eqDec = function () {
      this.eq = (this.eq + EQS.length - 1) % EQS.length;
      this._updateFilters();
    };

    this.playing = function () {
      return !!(this.normal && this.normal.src);
    };

    this.play = function () {
      if (this.mode !== 'normal') { return; }
      if (this.normal.src) { return; }

      this._play();
    };

    this.pause = function () {
      if (this.mode !== 'normal') { return; }
      if (!this.normal.src) { return; }

      this._pause ();
    };

    this.stop = function () {
      if (this.mode !== 'normal') { return; }

      this.normal.startPosition = 0;
      if (this.normal.src) {
        this._destroySrc ();
      }
    }; 

    this.eject = function () {
      if (this.mode !== 'normal') { return; }
      if (this.normal.src) {
        this._pause ();
      }
      this.normal.buffer = undefined;
      this.mode = 'open-file';
    };

    this.confirmInvalid = function () {
      if (this.mode !== 'invalid') { return; }
      this.mode = 'open-file';
    };

    // @draw

    var drawWave = function (bins, waveArrayL, waveArrayR) {
      var info = this_.waveInfo;
      var cxt = info.drawContext;
      cxt.fillStyle = '#000';

      var x, y, w, h, i;
      for (i = 0; i < bins; i++) {
        x = i * BIN_WIDTH;
        y = info.ch * (0.5 - 0.5 * waveArrayL[i]);
        w = BIN_WIDTH;
        h = info.ch * 0.5 * (waveArrayR[i] + waveArrayL[i]);
        cxt.fillRect (x, y, w, h);
      }
    };

    var drawSliderFrame = function () {
      var info = this_.sliderInfo;
      var cxt = info.drawContext;

      var time = this_._position();
      var x = Math.floor (time / this_.normal.audio.pixelDelta);

      cxt.clearRect (0, 0, info.cw, info.ch);
      cxt.fillStyle = '#bb0000';
      cxt.fillRect (x - 2, 0, 2, info.ch);
    };

    var drawBarsFrame = function () {
      var info = this_.barsInfo;
      var cxt = info.drawContext;
      var bw = Math.floor ((info.cw - (BARS_MARGIN_X * (BARS_N - 1))) / BARS_N);
      var bh = Math.floor ((info.ch - (BARS_MARGIN_Y * (BARS_M - 1))) / BARS_M);

      this_.analyser.getByteFrequencyData (this_.fftArray);
      cxt.clearRect (0, 0, info.cw, info.ch);
      cxt.fillStyle = '#000';

      var i, j, x, y, w, h;
      for (i = 0; i < BARS_N; i++) {
        j = Math.floor (this_.fftArray[i] / 256 * (BARS_M + 1));
        w = bw;
        h = j * (bh + BARS_MARGIN_Y);
        x = i * (bw + BARS_MARGIN_X);
        y = info.ch - h;
        cxt.fillRect (x, y, w, h);
      }
    };

    // @private methods

    /* _play ()
     * _pause ()
     * _position ()
     * _updateFilters ()
     * _destroySrc ()
     * _startAnimation ()
     */

    this._play = function () {
      var src = audioContext.createBufferSource();
      src.buffer = this.normal.audio.buffer;
      src.connect (this.input);
      src.onended = function () {
        debug ("src.onended", this);
        if (this_.normal && this_.normal.src === this) {
          this_.normal.startPosition = 0;
          this_._destroySrc ();
          $scope.$apply();
        }
      };
      src.start (0, this.normal.startPosition);

      this.normal.src = src;
      this.normal.srcCreationTime = audioContext.currentTime;
    };

    this._pause = function () {
      this.normal.startPosition = this._position();
      this._destroySrc ();
    };

    this._position = function () {
      var time = this_.normal.startPosition;
      if (this_.normal.src) {
        time += audioContext.currentTime
              - this_.normal.srcCreationTime;
      }
      return time;
    };

    this._updateFilters = function () {
      this.filterA.gain.value = EQS[this.eq].a;
      this.filterB.gain.value = EQS[this.eq].b;
      this.filterC.gain.value = EQS[this.eq].c;
    };

    this._destroySrc = function () {
      this.normal.src.stop(0);
      this.normal.src = undefined;
      this.normal.srcCreationTime = undefined;
    };

    this._startAnimation = function () {
      var loop = function () {
        if (this_.mode === 'normal') {
          drawSliderFrame ();
          drawBarsFrame ();
          requestAnimationFrame (loop);
        }
      };

      loop ();
    };

    // @callbacks

    this.callbacks.registerWaveCanvas = function (canvas) {
      this_.waveInfo = canvasSetup (canvas);
    };

    this.callbacks.registerSliderCanvas = function (canvas) {
      this_.sliderInfo = canvasSetup (canvas);
    };

    this.callbacks.registerBarsCanvas = function (canvas) {
      this_.barsInfo = canvasSetup (canvas);
    };

    this.callbacks.openFile = angular.bind (this, function(file) {
      if (this.mode === 'normal') {
        this.eject();
      }

      if (this.mode !== 'open-file') { return; }
      if (!file) { return; }

      var audio = {};
      audio.fileName = file.name;
      audio.title = '???';
      audio.artist = '???';
      audio.artworkUrl = 'vinyl.png';
      audio.metaFinished = false;
      audio.buffer = undefined;

      this.mode = 'loading';
      this.loading = {
        audio: audio
      };

      var possiblyFinish = function () {
        if (audio.buffer && audio.metaFinished) {
          this_.mode = 'normal';
          this_.loading = undefined;
          this_.normal = {
            startPosition: 0,
            audio: audio
          };
          this_._play();
          this_._startAnimation();
        }
      };

      var abort = function () {
        this_.loading = undefined;
        this_.mode = 'invalid';
      };

      var stillLoading = function (audio) {
        return this_.mode === 'loading' && this_.loading.audio === audio;
      };

      var errDecode = function (error) {
        debug ('errDecode', error);
        if (!stillLoading(audio)) { return; }

        abort();

        $scope.$apply();
      };

      var onDecode = function (buffer) {
        debug ('onDecode', buffer);
        if (!stillLoading(audio)) { return; }

        if (!this_.waveInfo) {
          return errDecode ("this.waveInfo should be initialized by now");
        }

        audio.buffer = buffer;
        var cw = this_.waveInfo.cw;
        var bins = Math.floor ((cw - 1) / BIN_WIDTH + 1);
        var waveArrayL = new Float32Array (bins);
        var waveArrayR = new Float32Array (bins);
        var channelL, channelR;

        if (buffer.numberOfChannels >= 2) {
          // stereo
          channelL = buffer.getChannelData(0);
          channelR = buffer.getChannelData(1);
        } else if (buffer.numberOfChannels === 1) {
          // mono
          channelL = buffer.getChannelData(0);
          channelR = channelL;
        } else {
          return errDecode ("unsupported number of channels");
        }

        var binSize = Math.floor (buffer.length / bins);
        var i, j, j0, j1;
        for (i = 0; i < bins; i++) {
          j0 = i * binSize;
          j1 = Math.min (buffer.length, (i + 1) * binSize);
          for (j = j0; j < j1; j++) {
            waveArrayL[i] += Math.abs(channelL[j]);
            waveArrayR[i] += Math.abs(channelR[j]);
          }
          waveArrayL[i] /= binSize;
          waveArrayR[i] /= binSize;
        }

        drawWave (bins, waveArrayL, waveArrayR);

        audio.pixelDelta = binSize / buffer.sampleRate / BIN_WIDTH;

        possiblyFinish ();

        $scope.$apply();
      };

      // @read file

      var reader = new FileReader();

      reader.onload = function (event) {
        debug ('reader.onload', event);
        if (!stillLoading(audio)) { return; }

        var data = event.target.result;
        audioContext.decodeAudioData(data, onDecode, errDecode);

        $scope.$apply();
      };

      reader.onerror = function (error) {
        debug ('reader.onerror', error);
        if (!stillLoading(audio)) { return; }

        abort();

        $scope.$apply();
      };

      reader.readAsArrayBuffer(file);

      // @meta

      var onMeta = function (meta) {
        debug ('onMeta', meta);
        if (!stillLoading(audio)) { return; }

        audio.title = (meta.title && noescape(meta.title))
          || audio.title;
        audio.artist = (meta.artist && noescape(meta.artist))
          || audio.artist;
        audio.artworkUrl =
          (meta.picture && URL.createObjectURL(meta.picture))
          || audio.artworkUrl;
        audio.metaFinished = true;

        possiblyFinish();

        $scope.$apply();
      };

      var errMeta = function (error) {
        debug ('errMeta', error);
        if (!stillLoading(audio)) { return; }

        audio.metaFinished = true;
        possiblyFinish();

        $scope.$apply();
      };

      parse_audio_metadata (file, onMeta, errMeta);
    });
  }]);

  // @directives

  app.directive('nxIgnoreDrops', function() {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        element.bind('drop', muteEvent);
        element.bind('dragover', muteEvent);
        element.bind('dragenter', muteEvent);
      }
    };
  });

  app.directive('nxDropFile', function() {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        var callback = scope.$eval(attrs.nxDropFile);

        var wrapped = function (event) {
          muteEvent (event);
          var file = (event.dataTransfer &&
                      event.dataTransfer.files[0])
                  || (event.originalEvent &&
                      event.originalEvent.dataTransfer &&
                      event.originalEvent.dataTransfer.files[0]);
          if (file) {
            callback(file);
            scope.$apply();
          } else {
            debug("can't retrieve the file");
          }
        };

        element.bind('drop', wrapped);
      }
    };
  });

  app.directive('nxInputFileChange', function() {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        var callback = scope.$eval(attrs.nxInputFileChange);
        var wrapped = function (event) {
          var file = event.target.files[0];
          callback(file);
          element[0].value = '';
          scope.$apply();
        };
        element.bind('change', wrapped);
      }
    };
  });

  app.directive('nxRegister', function() {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        var callback = scope.$eval(attrs.nxRegister);
        callback (element[0]);
      }
    };
  });
}());
