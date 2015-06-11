/*
 *
 *
 *
 * Copyright (c) 2015 MediaSQ
 * Licensed under the MIT license.
 */
(function ($) {
  'use strict';

  var KEYS = {
    ESC: 27,
    UP: 38,
    DOWN: 40
  };

  var MENTIONER_HOOK_CLASSES = {
    WRAPPER: 'js-mentioner-wrapper',
    DROPDOWN: 'js-mentioner-dropdown',
    DROPDOWN_ITEM: 'js-mentioner-dropdown-item'
  };

  var Mentioner = function($root, settings) {
    this.$root = $root;
    this.mentionSymbol = settings.mentionSymbol || '@';
    this.matcher = settings.matcher || $.noop;
    this.mentionables = (settings.requester ? settings.requester() : []).sort(function(prev, next){
      return prev.name.localeCompare(next.name);
    });

    this.buildDOM();
    this.attachEvents();
  };

  Mentioner.prototype.buildDOM = function() {
    var $parent = $( '<div class="' + MENTIONER_HOOK_CLASSES.WRAPPER + ' mentioner"></div>' );
    this.$root.wrap($parent);

    var $dropdown = $( '<ul class="' + MENTIONER_HOOK_CLASSES.DROPDOWN + ' mentioner__dropdown mentioner__dropdown--hidden dropdown"></ul>' );
    this.getParentWrapper().append($dropdown);
  };

  Mentioner.prototype.attachEvents = function() {
    /*
     * Not using Function.prototype.bind because of incompatibilities
     * with PhantomJS
     *
     * Related bug: https://github.com/ariya/phantomjs/issues/10522
     */
    this.$root.on('keydown', this.onRootKeydown());
    this.$root.on('input', this.onRootInput());
  };

  Mentioner.prototype.onRootKeydown = function() {
    var that = this;

    return function(event) {
      switch (event.keyCode) {
        case KEYS.ESC:
          that.hideDropdown();
          break;
        case KEYS.DOWN:
          that.selectNextDropdownOption();
        break;
        case KEYS.UP:
          that.selectPrevDropdownOption();
        break;
        default:
          return;
      }
    };
  };

  Mentioner.prototype.onRootInput = function() {
    var that = this;

    return function() {
      var text = that.$root.val();
      var lastMentionSymbolIndex = text.lastIndexOf(that.mentionSymbol);

      if(that.canBeSearchable(text, lastMentionSymbolIndex)) {
        var query = text.slice(lastMentionSymbolIndex + 1);
        that.search(query);
      } else {
        that.hideDropdown();
      }
    };
  };

  Mentioner.prototype.canBeSearchable = function(text, lastMentionSymbolIndex) {
    if(lastMentionSymbolIndex === -1) {
      return false;
    }

    var preMentionSymbolChar = text.charAt(lastMentionSymbolIndex - 1);
    var postMentionSymbolChar = text.charAt(lastMentionSymbolIndex  + 1);
    var isValidPreMentionSymbolChar = this.isValidPreMentionSymbolChar(preMentionSymbolChar);
    var isValidPostMentionSymbolChar = this.isValidPostMentionSymbolChar(postMentionSymbolChar);

    return isValidPreMentionSymbolChar && isValidPostMentionSymbolChar;
  };

  Mentioner.prototype.isValidPreMentionSymbolChar = function(preMentionSymbolChar) {
    // Prevent the dropdown to be shown when typing the mention symbol
    // after alphanumeric characters
    return !(/\w/g).test(preMentionSymbolChar);
  };

  Mentioner.prototype.isValidPostMentionSymbolChar = function(postMentionSymbolChar) {
    return postMentionSymbolChar !== " ";
  };

  Mentioner.prototype.search = function(query) {
    var that = this;

    var candidates = this.mentionables.filter(function(mentionable) {
      return that.matcher.call(that, mentionable, query);
    });

    if(candidates.length > 0) {
      this.showDropdown(candidates);
    } else {
      this.hideDropdown();
    }
  };

  Mentioner.prototype.getParentWrapper = function() {
    return this.$root.parent();
  };

  Mentioner.prototype.getDropdown = function() {
    return this.getParentWrapper().find('.' + MENTIONER_HOOK_CLASSES.DROPDOWN);
  };

  Mentioner.prototype.showDropdown = function(candidates) {
    var $dropdown = this.getDropdown();
    var $dropdownOptionsToAppend = this.getDropdownOptionsToAppend($dropdown, candidates);
    var style = this.getStyleForDropdown();

    $dropdown.empty().append($dropdownOptionsToAppend);
    $dropdown.attr('style', style);
    $dropdown.removeClass('mentioner__dropdown--hidden');
  };

  Mentioner.prototype.getDropdownOptionsToAppend = function($dropdown, candidates) {
    var that = this;
    var $dropdownOptions = $dropdown.find('.' + MENTIONER_HOOK_CLASSES.DROPDOWN_ITEM);

    return candidates.map(function(candidate) {
      var $relatedDropdownOption = $dropdownOptions.filter(function() {
        return $(this).data('mentionable-id') === candidate.id;
      });

      if($relatedDropdownOption.length !== 0) {
        return $relatedDropdownOption;
      } else {
        return that.createDropdownOption(candidate);
      }
    });
  };

  Mentioner.prototype.createDropdownOption = function(mentionable) {
    var $item = $( '<li class="' + MENTIONER_HOOK_CLASSES.DROPDOWN_ITEM + ' dropdown__item"></li>' );
    var $name = $( '<p class="dropdown__item__name">' + mentionable.name + '</p>' );
    var $avatar = $([
      '<div class="dropdown__item__avatar">',
        '<img class="dropdown__item__avatar__image" src="' + mentionable.avatar + '" />',
      '</div>'
    ].join("\n"));

    $item.append($avatar);
    $item.append($name);
    $item.data('mentionable-id', mentionable.id);

    return $item;
  };

  Mentioner.prototype.getSelectedDropdownOption = function() {
    return $( 'dropdown__item--selected' );
  };

  Mentioner.prototype.getStyleForDropdown = function() {
    var top = this.$root.outerHeight() - 3;
    var width = this.$root.innerWidth();

    return 'top: ' + top + 'px; width: ' + width + 'px;';
  };

  Mentioner.prototype.hideDropdown = function() {
    var $dropdown = this.getDropdown();
    $dropdown.addClass('mentioner__dropdown--hidden');
  };

  Mentioner.prototype.selectPrevDropdownOption = function() {

  };

  Mentioner.prototype.selectNextDropdownOption = function() {

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
