/*
 *
 *
 *
 * Copyright (c) 2015 MediaSQ
 * Licensed under the MIT license.
 */
(function ($) {
  'use strict';

  var ESCAPE_KEY_CODE = 27;

  var MENTIONER_WRAPPER_HOOK_CLASS = 'js-mentioner-wrapper';
  var MENTIONER_DROPDOWN_HOOK_CLASS = 'js-mentioner-dropdown';

  var Mentioner = function($root, settings) {
    this.$root = $root;
    this.mentionSymbol = settings.mentionSymbol || '@';
    this.mentionables = settings.onDataRequest ? settings.onDataRequest() : [];

    this._buildDOM();
    this._attachEvents();
  };

  Mentioner.prototype._buildDOM = function() {
    var $parent = $( '<div class="' + MENTIONER_WRAPPER_HOOK_CLASS + ' mentioner"></div>' );
    this.$root.wrap($parent);

    var $dropdown = $( '<ul class="' + MENTIONER_DROPDOWN_HOOK_CLASS + ' mentioner__dropdown mentioner__dropdown--hidden dropdown"></ul>' );
    this.getParentWrapper().append($dropdown);
  };

  Mentioner.prototype._attachEvents = function() {
    /*
     * Not using Function.prototype.bind because of incompatibilities
     * with PhantomJS
     *
     * Related bug: https://github.com/ariya/phantomjs/issues/10522
     */
    this.$root.on('keydown', this._onRootKeydown());
    this.$root.on('input', this._onRootInput());
  };

  Mentioner.prototype._onRootKeydown = function() {
    var that = this;

    return function(event) {
      if(event.keyCode === ESCAPE_KEY_CODE){
        that.hideDropdown();
      }
    };
  };

  Mentioner.prototype._onRootInput = function() {
    var that = this;

    return function() {
      var query = that.$root.val();
      var lastMentionSymbolIndex = query.lastIndexOf(that.mentionSymbol);

      if(lastMentionSymbolIndex > -1) {
        var preMentionSymbolChar = query.charAt(lastMentionSymbolIndex - 1);

        // Prevent the dropdown to be shown when typing the mention symbol
        // after alphanumeric characters
        if(!(/\w/g).test(preMentionSymbolChar)) {
          that.showDropdown();
        }
      }
    };
  };

  Mentioner.prototype.getParentWrapper = function() {
    return this.$root.parent();
  };

  Mentioner.prototype.getDropdown = function() {
    return this.getParentWrapper().find('.' + MENTIONER_DROPDOWN_HOOK_CLASS);
  };

  Mentioner.prototype.showDropdown = function() {
    var $dropdown = this.getDropdown().empty();

    this._calculateStyleForDropdown($dropdown);

    this.mentionables.forEach(function(mentionable) {
      var $item = $( '<li class="dropdown__item"></li>' );
      var $name = $( '<p class="dropdown__item__name">' + mentionable.name + '</p>' );

      $item.append($name);

      $dropdown.append($item);
    });

    $dropdown.removeClass('mentioner__dropdown--hidden');
  };

  Mentioner.prototype.hideDropdown = function() {
    var $dropdown = this.getDropdown();
    $dropdown.addClass('mentioner__dropdown--hidden');
  };

  Mentioner.prototype._calculateStyleForDropdown = function($dropdown) {
    var top = this.$root.outerHeight() - 3;
    var left = 3;
    var width = this.$root.outerWidth() - 9;

    var style = 'top: ' + top + 'px; left: ' + left + 'px; width: ' + width + 'px;';
    $dropdown.attr('style', style);
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
