/*
 *
 *
 *
 * Copyright (c) 2016 MediaSQ
 * Licensed under the MIT license.
 */
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
    DROPDOWN_ITEM: 'js-mentioner-dropdown-item',
    DROPDOWN_HELP_ITEM: 'js-mentioner-dropdown-help-item'
  };

  var CORRECTION_FACTOR_FOR_TEXT_RENDERING = 6;

  var Mentioner = function($root, settings) {
    this.$root = $root;
    this.currentEditorSelection = null;

    this.lastKeyDown = null;
    this.editor = settings.editor;
    this.minQueryLength = settings.minQueryLength || 0;
    this.mentionSymbol = settings.mentionSymbol || '@';
    this.dropdownHelpMessage = settings.dropdownHelpMessage || 'Type to search for results';
    this.matcher = settings.matcher || this.defaultMatcher;
    this.mentionables = [];

    if (settings.requester) {
      settings.requester.call(this, this.loadMentionables.bind(this));
    }

    this.buildDOM();
    this.attachEvents();
  };

  Mentioner.prototype.loadMentionables = function (mentionables) {
    this.mentionables = mentionables.sort(function(prev, next) {
      return prev.name.localeCompare(next.name);
    });
  };

  Mentioner.prototype.defaultMatcher = function (mentionable, query) {
    var regex = new RegExp('^' + query.toLowerCase());
    var hasMatch = false;

    var mentionableName = mentionable.name.toLowerCase();
    var candidates = [mentionableName];
    candidates.push.apply(candidates, mentionableName.split(' '));

    candidates.forEach(function(candidate) {
      if (regex.test(candidate)) {
        hasMatch = true;
      }
    });

    return hasMatch;
  };

  Mentioner.prototype.buildDOM = function() {
    var $parent = $( '<div class="' + MENTIONER_HOOK_CLASSES.WRAPPER + ' mentioner"></div>' );
    this.$root.wrap($parent);

    this.$root.addClass('mentioner__composer');

    var $dropdown = $( '<ul class="' + MENTIONER_HOOK_CLASSES.DROPDOWN + ' mentioner__dropdown mentioner__dropdown--hidden"></ul>' );
    this.$parentWrapper().append($dropdown);
  };

  Mentioner.prototype.attachEvents = function() {
    this.editor.subscribe('editableBlur', this.onRootBlur.bind(this));
    this.editor.subscribe('editableInput', this.onEditableInput.bind(this));
    this.editor.subscribe('editableKeyup', this.onEditableKeyup.bind(this));
    this.editor.subscribe('editableKeydown', this.onRootKeydown.bind(this));
    this.editor.subscribe('editableKeydownEnter', this.onRootKeydownEnter.bind(this));

    this.$dropdown().on('mousedown touchstart', '.' + MENTIONER_HOOK_CLASSES.DROPDOWN_HELP_ITEM, this.onDropdownHelpItemMousedown.bind(this));
    this.$dropdown().on('mousedown touchstart', '.' + MENTIONER_HOOK_CLASSES.DROPDOWN_ITEM, this.onDropdownItemMousedown.bind(this));

    this.$dropdown().on('click touchend', '.' + MENTIONER_HOOK_CLASSES.DROPDOWN_ITEM, this.onDropdownItemClick.bind(this));
    this.$dropdown().on('touchmove', '.' + MENTIONER_HOOK_CLASSES.DROPDOWN_ITEM, this.onDropdownItemTouchmove.bind(this));
  };

  Mentioner.prototype.onRootBlur = function() {
    this.hideDropdown();

    this.currentEditorSelection = null;
  };

  Mentioner.prototype.onEditableInput = function() {
    var text = this.$root.text();
    var selection = this.editor.exportSelection();
    var preSelectionText = text.slice(0, selection.end);
    var lastMentionSymbolIndex = preSelectionText.lastIndexOf(this.mentionSymbol);
    var query = preSelectionText.slice(lastMentionSymbolIndex + 1);

    if (lastMentionSymbolIndex > -1 && this.lastKeyDown !== KEYS.RETURN) {
      if (query.length >= this.minQueryLength) {
        this.search(query);
      } else {
        this.showDropdownHelp();
      }
    } else {
      this.hideDropdown();
    }
  };

  Mentioner.prototype.dropdownEventWrapper = function(event, callback) {
    if (this.isDropdownDisplayed()) {
      event.preventDefault();

      callback.call(this);
    }
  };

  Mentioner.prototype.onEditableKeyup = function(event) {
    if (event.keyCode === KEYS.RETURN) {
      this.dropdownEventWrapper(event, function() {
        this.currentEditorSelection = this.editor.exportSelection();

        this.getSelectedDropdownOption().trigger('click');
      });
    }
  };

  Mentioner.prototype.onRootKeydown = function(event) {
    this.lastKeyDown = event.keyCode;

    switch (event.keyCode) {
    case KEYS.ESC:
      this.dropdownEventWrapper(event, function() {
        this.hideDropdown();
      });
      break;
    case KEYS.DOWN:
      this.dropdownEventWrapper(event, function() {
        this.selectOtherDropdownOption(function($selected) {
          return $selected.next().length === 0 ? $selected.siblings().first() : $selected.next();
        });
      });
      break;
    case KEYS.UP:
      this.dropdownEventWrapper(event, function() {
        this.selectOtherDropdownOption(function($selected) {
          return $selected.prev().length === 0 ? $selected.siblings().last() : $selected.prev();
        });
      });
      break;
    default:
      return true;
    }
  };

  Mentioner.prototype.onRootKeydownEnter = function(event) {
    this.dropdownEventWrapper(event, $.noop);
  };

  Mentioner.prototype.onDropdownHelpItemMousedown = function(event) {
    event.preventDefault();
  };

  Mentioner.prototype.onDropdownItemMousedown = function(event) {
    event.preventDefault();

    this.currentEditorSelection = this.editor.exportSelection();
  };

  Mentioner.prototype.onDropdownItemTouchmove = function() {
    this.currentEditorSelection = null;
  };

  Mentioner.prototype.onDropdownItemClick = function(event) {
    event.preventDefault();

    if (!this.currentEditorSelection) {
      return; // We don't know where to paste the mention
    }

    this.restoreFocus();

    var mentionable = $(event.currentTarget).data('mentionable');
    var inputId = new Date().getTime();
    var inputValue = this.mentionSymbol + mentionable.name;
    var inputWidth = this.getWidthForInput(inputValue);
    var html = '<input id="' + inputId + '" data-mentionable-id="' + mentionable.id + '" value="' +
      inputValue + '" style="width:' + inputWidth + 'px;" class="mentioner__composer__mention js-mention" disabled />';

    this.editor.pasteHTML(html, { forcePlainText: false, cleanAttrs: [] });

    var selection = this.editor.exportSelection();
    var removed = this.clearMentionTextTrigger(selection);
    this.addBlankAfterMention(inputId);
    this.recalculateSelection(selection, removed);

    this.hideDropdown();
  };

  Mentioner.prototype.restoreFocus = function() {
    this.$root.focus();

    this.editor.importSelection(this.currentEditorSelection);

    this.currentEditorSelection = null;
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
    var sanetizedMentionTextTrigger = this.replaceNbspEntities(mentionTextTrigger, '&nbsp;');
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

    return width + CORRECTION_FACTOR_FOR_TEXT_RENDERING;
  };

  Mentioner.prototype.search = function(query) {
    var that = this;
    var sanitizedQuery = that.escapeRegExp(that.replaceNbspEntities(query));
    var candidates = that.mentionables.filter(function(mentionable) {
      return that.matcher.call(that, mentionable, sanitizedQuery);
    });

    if (candidates.length > 0) {
      that.showDropdownCandidates(candidates, sanitizedQuery);
    } else {
      that.hideDropdown();
    }
  };

  Mentioner.prototype.replaceAt = function(string, index, replacement) {
    return string.slice(0, index) + replacement + string.slice(index + 1);
  };

  Mentioner.prototype.replaceNbspEntities = function(query, replacement) {
    replacement = replacement || ' ';
    var nbsp = String.fromCharCode(160);
    var nbspIndex = query.indexOf(nbsp);

    if (nbspIndex > -1) {
      return query.length > 1 ? this.replaceAt(query, nbspIndex, replacement) : replacement;
    } else {
      return query;
    }
  };

  Mentioner.prototype.escapeRegExp = function(query) {
    // "Is there a RegExp.escape function in Javascript?": http://stackoverflow.com/a/3561711
    return query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
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

  Mentioner.prototype.showDropdownCandidates = function(candidates, query) {
    var $dropdownOptionsToAppend = this.getDropdownOptionsToAppend(candidates);

    var $dropdown = this.$dropdown();
    $dropdown.find('.' + MENTIONER_HOOK_CLASSES.DROPDOWN_HELP_ITEM).remove();
    $dropdown.append($dropdownOptionsToAppend);

    this.highlightDropdownOptions($dropdownOptionsToAppend, query);
    this.removeOrphanDropdownOptions(candidates);
    this.checkSelectedDropdownOption();
    this.showDropdown($dropdown);
  };

  Mentioner.prototype.showDropdownHelp = function () {
    var $helpMessage = $([
      '<li class="' + MENTIONER_HOOK_CLASSES.DROPDOWN_HELP_ITEM + ' mentioner__dropdown__item mentioner__dropdown__item--help">',
      this.dropdownHelpMessage,
      '</li>'
    ].join(''));

    var $dropdown = this.$dropdown().empty();
    $dropdown.append($helpMessage);

    this.showDropdown($dropdown);
  };

  Mentioner.prototype.showDropdown = function ($dropdown) {
    $dropdown.attr('style', this.getStyleForDropdown());
    $dropdown.removeClass('mentioner__dropdown--hidden');
  };

  Mentioner.prototype.getDropdownOptionsToAppend = function(candidates) {
    var that = this;
    return candidates.map(function(candidate) {
      var $relatedDropdownOption = that.getDropdownOptions().filter(function() {
        var mentionable = $(this).data('mentionable');

        return mentionable.id === candidate.id;
      });

      if ($relatedDropdownOption.length !== 0) {
        $relatedDropdownOption.find('p').html(candidate.name);

        return $relatedDropdownOption;
      } else {
        return that.createDropdownOption(candidate);
      }
    });
  };

  Mentioner.prototype.highlightDropdownOptions = function ($elements, query) {
    $elements.forEach(function($el) {
      var $p = $el.find('p');
      var currentHtml = $p.html();
      var queryIndex = currentHtml.toLowerCase().indexOf(query.toLowerCase());
      var result = currentHtml.slice(queryIndex, queryIndex + query.length);
      var html = currentHtml.replace(result, '<span class="mentioner__dropdown__item__name__highlight">' + result + '</span>');

      $p.html(html);
    });
  };

  // Removes those old dropdown options which don't have a related candidate
  Mentioner.prototype.removeOrphanDropdownOptions = function(candidates) {
    this.getDropdownOptions().each(function() {
      var mentionable = $(this).data('mentionable');
      var candidate = candidates.filter(function(c) {
        return c.id === mentionable.id;
      })[0];

      if (!candidate) {
        $(this).remove();
      }
    });
  };

  Mentioner.prototype.createDropdownOption = function(mentionable) {
    var $item = $( '<li class="' + MENTIONER_HOOK_CLASSES.DROPDOWN_ITEM + ' mentioner__dropdown__item"></li>' );
    var $name = $( '<p class="mentioner__dropdown__item__name">' + mentionable.name + '</p>' );
    var $avatar;

    if (mentionable.$avatar) {
      $avatar = $( '<div class="mentioner__dropdown__item__avatar"></div>' );

      $item.append($avatar.append(mentionable.$avatar));
    }

    $item.append($name).data('mentionable', mentionable);

    return $item;
  };

  Mentioner.prototype.checkSelectedDropdownOption = function() {
    var $selected = this.getSelectedDropdownOption();

    if ($selected.length === 0) {
      var $oldSelected = $();
      var $newSelected = this.getDropdownOptions().first();

      this.selectDropdownOption($oldSelected, $newSelected);
    }
  };

  Mentioner.prototype.getSelectedDropdownOption = function() {
    return this.$dropdown().find('.mentioner__dropdown__item--selected, .' + MENTIONER_HOOK_CLASSES.DROPDOWN_HELP_ITEM);
  };

  Mentioner.prototype.getStyleForDropdown = function() {
    var top = this.$root.outerHeight() + 10;
    var left = this.$root.offset().left - this.$root.parent().offset().left;

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
    var $newSelected = $oldSelected.siblings().length === 0 ? $oldSelected : getter.call(this, $oldSelected);

    this.selectDropdownOption($oldSelected, $newSelected);
    this.manageDropdownScroll();
  };

  Mentioner.prototype.selectDropdownOption = function($oldSelected, $newSelected) {
    $oldSelected.removeClass('mentioner__dropdown__item--selected');
    $newSelected.addClass('mentioner__dropdown__item--selected');
  };

  Mentioner.prototype.manageDropdownScroll = function() {
    var $dropdown = this.$dropdown();
    var $selected = this.getSelectedDropdownOption();
    var isLastItem = $selected.next().length === 0;
    var isAboveTheScroll = $selected.position().top < 0;
    var isBeyondTheScroll = $dropdown.scrollTop() + $selected.position().top + $selected.outerHeight() > $dropdown.scrollTop() + $dropdown.outerHeight();

    if (isAboveTheScroll || isLastItem) {
      $dropdown.scrollTop($dropdown.scrollTop() + $selected.position().top);
    } else if (isBeyondTheScroll) {
      $dropdown.scrollTop($dropdown.scrollTop() + $selected.outerHeight());
    }
  },

  Mentioner.prototype.serialize = function() {
    return this.$root.html();
  };

  Mentioner.prototype.getMentions = function () {
    var that = this;
    var $mentions = that.$root.find('input');

    return $.makeArray($mentions).map(function(mention) {
      var id = $(mention).data('mentionableId');
      var mentionables = that.mentionables.filter(function(mentionable) {
        return mentionable.id === id;
      });

      // We are comparing by id, so we assume that we only have one result
      return mentionables[0];
    });
  };

  Mentioner.prototype.isEmpty = function () {
    return this.serialize() === '';
  };

  Mentioner.prototype.triggerMention = function () {
    this.lastKeyDown = null; // Reset the lastKeyDown variable for preventing
                             // false values from the last interaction.

    if (this.isEmpty()) {
      this.editor.pasteHTML('<p>' + this.mentionSymbol + '</p>');
    } else {
      this.editor.cleanPaste(this.mentionSymbol);
    }
  };

  var Api = function($root, settings) {
    this.mentioner = new Mentioner($root, settings);
  };

  Api.prototype.serialize = function () {
    return this.mentioner.serialize();
  };

  Api.prototype.getMentions = function () {
    return this.mentioner.getMentions();
  };

  Api.prototype.triggerMention = function () {
    this.mentioner.triggerMention();
  };

  $.fn.mentioner = function (options) {
    if (typeof options === 'object') {
      return this.each(function () {
        var $subject = $( this );
        if ($subject.data('mentioner') === undefined) {
          $subject.data('mentioner', new Api($subject, options));
        }
      });
    } else if (typeof options === 'string') {
      var instance = $( this ).data('mentioner');
      if (instance && typeof instance[options] === 'function') {
        return instance[options]();
      }
    }
  };
}(jQuery));
