/*! jquery.mentioner - v0.0.1 - 2015-06-22
* Copyright (c) 2015 MediaSQ; Licensed MIT */
(function ($) {
  'use strict';

  var KEYS = {
    ESC: 27,
    UP: 38,
    DOWN: 40,
    RETURN: 13
  };

  var MENTIONER_HOOK_CLASSES = {
    WRAPPER: 'js-mentioner-wrapper',
    DROPDOWN: 'js-mentioner-dropdown',
    DROPDOWN_ITEM: 'js-mentioner-dropdown-item'
  };

  var Mentioner = function($root, settings) {
    this.$root = $root;

    this.lastKeyDown = null;
    this.editor = settings.editor;
    this.minQueryLength = settings.minQueryLength || 1;
    this.maxMentionablesToShow = settings.maxMentionablesToShow || 5;
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

    this.$root.addClass('mentioner__composer composer');

    var $dropdown = $( '<ul class="' + MENTIONER_HOOK_CLASSES.DROPDOWN + ' mentioner__dropdown mentioner__dropdown--hidden dropdown"></ul>' );
    this.$parentWrapper().append($dropdown);
  };

  Mentioner.prototype.attachEvents = function() {
    /*
     * Not using Function.prototype.bind because of incompatibilities
     * with PhantomJS
     *
     * Related bug: https://github.com/ariya/phantomjs/issues/10522
     */
    this.editor.subscribe('editableBlur', this.onRootBlur());
    this.editor.subscribe('editableInput', this.onEditableInput());
    this.editor.subscribe('editableKeyup', this.onEditableKeyup());
    this.editor.subscribe('editableKeydown', this.onRootKeydown());
    this.editor.subscribe('editableKeydownEnter', this.onRootKeydownEnter());

    this.$dropdown().on('mousedown', '.' + MENTIONER_HOOK_CLASSES.DROPDOWN_ITEM, this.onDropdownItemMousedown());
  };

  Mentioner.prototype.onRootBlur = function() {
    var that = this;

    return function() {
      that.hideDropdown();
    };
  };

  Mentioner.prototype.onEditableInput = function() {
    var that = this;

    return function() {
      var text = that.$root.text();
      var selection = that.editor.exportSelection();
      var preSelectionText = text.slice(0, selection.end);
      var lastMentionSymbolIndex = preSelectionText.lastIndexOf(that.mentionSymbol);
      var query = preSelectionText.slice(lastMentionSymbolIndex + 1);

      if(lastMentionSymbolIndex > -1 && that.lastKeyDown !== KEYS.RETURN && query.length >= that.minQueryLength) {
        that.search(query);
      } else {
        that.hideDropdown();
      }
    };
  };

  Mentioner.prototype.dropdownEventWrapper = function(event, callback) {
    if(this.isDropdownDisplayed()) {
      event.preventDefault();

      callback.call(this);
    }
  };

  Mentioner.prototype.onEditableKeyup = function() {
    var that = this;

    return function(event) {
      if(event.keyCode === KEYS.RETURN) {
        that.dropdownEventWrapper(event, function() {
          this.getSelectedDropdownOption().trigger('mousedown');
        });
      }
    };
  };

  Mentioner.prototype.onRootKeydown = function() {
    var that = this;

    return function(event) {
      that.lastKeyDown = event.keyCode;

      switch (event.keyCode) {
        case KEYS.ESC:
          that.dropdownEventWrapper(event, function() {
            this.hideDropdown();
          });
        break;
        case KEYS.DOWN:
          that.dropdownEventWrapper(event, function() {
            this.selectOtherDropdownOption(function($selected) {
              return $selected.next().length === 0 ? $selected.siblings().first() : $selected.next();
            });
          });
        break;
        case KEYS.UP:
          that.dropdownEventWrapper(event, function() {
            this.selectOtherDropdownOption(function($selected) {
              return $selected.prev().length === 0 ? $selected.siblings().last() : $selected.prev();
            });
          });
        break;
        default:
          return true;
      }
    };
  };

  Mentioner.prototype.onRootKeydownEnter = function() {
    var that = this;

    return function(event) {
      that.dropdownEventWrapper(event, $.noop);
    };
  };

  Mentioner.prototype.onDropdownItemMousedown = function() {
    var that = this;

    return function(event) {
      event.preventDefault();

      var mentionable = $(this).data('mentionable');
      var inputId = new Date().getTime();
      var inputWidth = that.getWidthForInput(mentionable.name);
      var html = '<input id="' + inputId + '" value="' + mentionable.name + '" style="width:' + inputWidth + 'px;" class="composer__mention js-mention" readonly />';

      that.editor.pasteHTML(html, { forcePlainText: false, cleanAttrs: [] });

      var selection = that.editor.exportSelection();
      var removed = that.clearMentionTextTrigger(selection);
      that.addBlankAfterMention(inputId);
      that.recalculateSelection(selection, removed);

      that.hideDropdown();
    };
  };

  Mentioner.prototype.recalculateSelection = function(oldSelection, removedText) {
    var blankLength = 1;
    var newSelectionPosition = oldSelection.end - removedText.length + blankLength;

    this.editor.importSelection({ start: newSelectionPosition, end: newSelectionPosition });
  };

  Mentioner.prototype.addBlankAfterMention = function(id) {
    var $mention = this.$root.find('#' + id);
    var $blank = $( '<span>&nbsp;</span>' );

    $blank.insertAfter($mention);

    // We cannot mantain the <span> tag for preserving the editor HTML structure
    $blank.replaceWith('&nbsp;');
  };

  Mentioner.prototype.clearMentionTextTrigger = function(selection) {
    var text = this.$root.text();
    var preMentionText = text.slice(0, selection.end);
    var currentMentionSymbolIndex = preMentionText.lastIndexOf(this.mentionSymbol);
    var mentionTextTrigger = preMentionText.slice(currentMentionSymbolIndex, selection.end);
    var sanetizedMentionTextTrigger = this.clearEntities(mentionTextTrigger, {
      "160": function(index, query) {
        return query.length > 1 ? this.replaceAt(query, index, '&nbsp;') : '&nbsp;';
      }
    });
    var regex = new RegExp('(' + sanetizedMentionTextTrigger + ')(<input)');
    var normalized = this.$root.html().replace(regex, function(match, p1, p2) { return p2; });

    this.$root.html(normalized);

    return mentionTextTrigger;
  };

  Mentioner.prototype.getWidthForInput = function(text) {
    var $span = $('<span style="visibility: hidden;"></span>').text(text);
    this.$root.append($span);
    var width = $span.width();
    $span.remove();

    return width;
  };

  Mentioner.prototype.search = function(query) {
    var that = this;
    var sanitizedQuery = that.clearEntities(query);
    var candidates = that.mentionables.filter(function(mentionable) {
      return that.matcher.call(that, mentionable, sanitizedQuery);
    }).slice(0, that.maxMentionablesToShow);

    if(candidates.length > 0) {
      that.showDropdown(candidates);
    } else {
      that.hideDropdown();
    }
  };

  Mentioner.prototype.replaceAt = function (string, index, replacement) {
    return string.slice(0, index) + replacement + string.slice(index + 1);
  };

  Mentioner.prototype.clearEntities = function(query, customReplacements) {
    var replacements = $.extend({}, {
      "160": function(index, query) {
        return query.length > 1 ? this.replaceAt(query, index, ' ')  : ' ';
      },
      "10": function(index, query) {
        return query.slice(0, index);
      }
    }, customReplacements);

    var result = query;

    for(var code in replacements) {
      var replacement = replacements[code];
      var charCode = String.fromCharCode(parseInt(code));
      var entityIndex = result.indexOf(charCode);

      if(entityIndex > -1) {
        result = replacement.call(this, entityIndex, result);
      }
    }

    return result;
  };

  Mentioner.prototype.$parentWrapper = function() {
    return this.$root.parent();
  };

  Mentioner.prototype.$dropdown = function() {
    return this.$parentWrapper().find('.' + MENTIONER_HOOK_CLASSES.DROPDOWN);
  };

  Mentioner.prototype.getDropdownOptions = function() {
    return this.$dropdown().find('.' + MENTIONER_HOOK_CLASSES.DROPDOWN_ITEM);
  };

  Mentioner.prototype.showDropdown = function(candidates) {
    var $dropdownOptionsToAppend = this.getDropdownOptionsToAppend(candidates);

    var $dropdown = this.$dropdown();
    $dropdown.append($dropdownOptionsToAppend);
    $dropdown.attr('style', this.getStyleForDropdown());
    $dropdown.removeClass('mentioner__dropdown--hidden');

    this.removeOrphanDropdownOptions(candidates);
    this.checkSelectedDropdownOption();
  };

  Mentioner.prototype.getDropdownOptionsToAppend = function(candidates) {
    var that = this;
    return candidates.map(function(candidate) {
      var $relatedDropdownOption = that.getDropdownOptions().filter(function() {
        var mentionable = $(this).data('mentionable');

        return mentionable.id === candidate.id;
      });

      if($relatedDropdownOption.length !== 0) {
        return $relatedDropdownOption;
      } else {
        return that.createDropdownOption(candidate);
      }
    });
  };

  // Removes those old dropdown options which don't have a related candidate
  Mentioner.prototype.removeOrphanDropdownOptions = function(candidates) {
    this.getDropdownOptions().each(function() {
      var mentionable = $(this).data('mentionable');
      var candidate = candidates.filter(function(candidate) {
        return candidate.id === mentionable.id;
      })[0];

      if(!candidate) {
        $(this).remove();
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
    ].join('\n'));

    $item.append($avatar);
    $item.append($name);
    $item.data('mentionable', mentionable);

    return $item;
  };

  Mentioner.prototype.checkSelectedDropdownOption = function() {
    var $selected = this.getSelectedDropdownOption();

    if($selected.length === 0) {
      var $oldSelected = $();
      var $newSelected = this.getDropdownOptions().first();

      this.selectDropdownOption($oldSelected, $newSelected);
    }
  };

  Mentioner.prototype.getSelectedDropdownOption = function() {
    return this.$dropdown().find('.dropdown__item--selected');
  };

  Mentioner.prototype.getStyleForDropdown = function() {
    var top = this.$root.outerHeight() + 10;
    var rootPaddingLeft = this.$root.css('padding-left');
    var left = this.$root.offset().left - parseInt(rootPaddingLeft);

    return 'top: ' + top + 'px; left: ' + left + 'px;';
  };

  Mentioner.prototype.hideDropdown = function() {
    var $dropdown = this.$dropdown();
    $dropdown.addClass('mentioner__dropdown--hidden');
  };

  Mentioner.prototype.isDropdownDisplayed = function() {
    return !this.$dropdown().hasClass('mentioner__dropdown--hidden');
  };

  Mentioner.prototype.selectOtherDropdownOption = function(getter) {
    var $oldSelected = this.getSelectedDropdownOption();
    var $newSelected = getter.call(this, $oldSelected);
    this.selectDropdownOption($oldSelected, $newSelected);
  };

  Mentioner.prototype.selectDropdownOption = function($oldSelected, $newSelected) {
    $oldSelected.removeClass('dropdown__item--selected');
    $newSelected.addClass('dropdown__item--selected');
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
