/*global window, document, requestAnimationFrame*/

(function() { window.addEventListener('load', function () {
  var element, outer;

  var update = function () {
    var minY = outer.offsetTop;
    var maxY = outer.offsetTop + outer.offsetHeight - element.offsetHeight;

    var y = document.documentElement.scrollTop || document.body.scrollTop;

    if (y >= minY && y < maxY) {
      element.classList.add ('stuck');
    } else {
      element.classList.remove ('stuck');
    }

    if (y >= maxY) {
      element.classList.add ('stuck-bottom');
    } else {
      element.classList.remove ('stuck-bottom');
    }
  };

  var throttled = function (f) {
    var block = false;
    return function () {
      if (!block) {
        block = true;
        requestAnimationFrame (function() {
          f ();
          block = false;
        });
      }
    };
  };

  element = document.getElementById('fly-head-wrapper');
  outer = document.getElementById('fly');
  var style = window.getComputedStyle(element);
  var sticky = style.getPropertyValue('position').endsWith('sticky');
  console.log("Debug:", style.getPropertyValue('position'));
  if (!sticky) { // Браузер не поддерживает это значение

    var checkboxDepart = document.getElementById('checkbox-depart');
    var checkboxArrive = document.getElementById('checkbox-arrive');

    var throttledUpdate = throttled (update);
    checkboxDepart.addEventListener('input', throttledUpdate);
    checkboxArrive.addEventListener('input', throttledUpdate);
    window.addEventListener('scroll', throttledUpdate);
  }
});}());
