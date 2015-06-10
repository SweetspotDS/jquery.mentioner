/*
 *
 *
 *
 * Copyright (c) 2015 MediaSQ
 * Licensed under the MIT license.
 */
(function ($) {
  'use strict';

  var AT_SIGN_KEY_CODE = 64;

  var MENTIONER_WRAPPER_HOOK_CLASS = 'js-mentioner-wrapper';
  var MENTIONER_DROPDOWN_HOOK_CLASS = 'js-mentioner-dropdown';

  var Mentioner = function($root, settings) {
    this.$root = $root;
    this.mentionables = settings.onDataRequest ? settings.onDataRequest() : [];

    this._buildDOM();
    this._attachEvents();
  };

  Mentioner.prototype._buildDOM = function() {
    var $parent = $( '<div class="' + MENTIONER_WRAPPER_HOOK_CLASS + '"></div>' );
    this.$root.wrap($parent);

    var $dropdown = $( '<div class="' + MENTIONER_DROPDOWN_HOOK_CLASS + '"></div>' );
    this.getParentWrapper().append($dropdown);
  };

  Mentioner.prototype._attachEvents = function() {
    this.$root.on('keypress', this._onRootKeypress.bind(this));
  };

  Mentioner.prototype._onRootKeypress = function(event) {
    if(event.keyCode === AT_SIGN_KEY_CODE) {
      this.showDropdown();
    }
  };

  Mentioner.prototype.getParentWrapper = function() {
    return this.$root.parent();
  };

  Mentioner.prototype.getDropdown = function() {
    return this.getParentWrapper().find('.' + MENTIONER_DROPDOWN_HOOK_CLASS);
  };

  Mentioner.prototype.showDropdown = function() {
    var $dropdown = this.getDropdown().empty();

    this.mentionables.forEach(function(mentionable) {
      var $item = $( '<p>' + mentionable.name + '</p>' );
      $dropdown.append($item);
    });
  };

  $.fn.mentioner = function (settings) {
    settings = settings || {};

    return this.each(function () {
      var $subject = $( this );

      if($subject.data('mentioner') === undefined) {
        $subject.data('mentioner', new Mentioner($subject, settings));
      }
    });
  };
}(jQuery));
