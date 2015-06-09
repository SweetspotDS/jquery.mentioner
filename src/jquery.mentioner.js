/*
 *
 *
 *
 * Copyright (c) 2015 MediaSQ
 * Licensed under the MIT license.
 */
(function ($) {
  'use strict';

  $.fn.mentioner = function (settings) {
    return this.each(function () {
      var $subject = $( this );

      if($subject.data('mentioner') === undefined) {
        $subject.data('mentioner', settings);
      }
    });
  };
}(jQuery));
