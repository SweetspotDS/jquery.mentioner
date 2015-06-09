/*
 *
 *
 *
 * Copyright (c) 2015 MediaSQ
 * Licensed under the MIT license.
 */
(function ($) {
  'use strict';

  $.fn.mentioner = function () {
    return this.each(function (i) {
      // Do something to each selected element.
      $(this).html('jquery.mentioner' + i);
    });
  };
}(jQuery));
