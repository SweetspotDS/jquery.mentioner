(function ($) {
  describe('jQuery#mentioner', function() {

    var medium, $editor;

    before(function() {
      medium = new MediumEditor('.js-editor', { placeholder: false, disableToolbar: true });
      $editor = $( '.js-editor' ).mentioner({
        editor: medium,
        requester: function(callback) {
          callback.call(this, [
            { name: 'Jon Snow', avatar: '', id: 0 },
            { name: 'Sansa Stark', avatar: '', id: 5 },
            { name: 'Arya Stark', avatar: '', id: 6 },
            { name: 'Petyr Baelish', avatar: '', id: 7 },
            { name: 'Hodor', avatar: '', id: 8 }
          ]);
        }
      });
    });

    it('has an Api instance attached', function() {
      $editor.data('mentioner').should.exist;
    });

    describe('DOM structure', function() {

      it('has a valid parent wrapper', function() {
        $editor.parent().hasClass('js-mentioner-wrapper').should.be.true;
      });

      it('has a dropdown sibling', function() {
        $editor.next().hasClass('js-mentioner-dropdown').should.be.true;
      });

    });

    describe('Dropdown', function() {

      var $candidates;

      before(function() {
        $editor.focus();
        medium.cleanPaste('@S');

        $candidates = $( '.js-mentioner-dropdown-item' );
      });

      it('has the correct candidates', function() {
        $candidates.length.should.equal(3);
      });

      it('adds the selected class to the first candidate', function() {
        $candidates.first().hasClass('mentioner__dropdown__item--selected').should.be.true;
      });

      it('highlights the part of the candidate\'s name that matches the query', function() {
        $candidates.each(function() {
          var $p = $(this).find('p');
          var highlight = '<span class="mentioner__dropdown__item__name__highlight">S</span>';
          var index = $p.html().indexOf(highlight);

          index.should.not.equal(-1);
        });
      });

    });

    describe('Editor', function() {

      describe('Navigate through the dropdown', function() {
        it('goes to the bottom when there are not any previous sibling', function() {
          var event = $.Event('keydown', {
            keyCode: 38 // UP
          });

          medium.trigger('editableKeydown', event, $editor);

          var $dropdownItems = $( '.js-mentioner-dropdown-item' );
          $dropdownItems.last().hasClass('mentioner__dropdown__item--selected').should.be.true;
        });

        it('goes to the top when there are not any next sibling', function() {
          var event = $.Event('keydown', {
            keyCode: 40 // DOWN
          });

          medium.trigger('editableKeydown', event, $editor);

          var $dropdownItems = $( '.js-mentioner-dropdown-item' );
          $dropdownItems.first().hasClass('mentioner__dropdown__item--selected').should.be.true;
        });

        it('goes down successfully when it has a next sibling', function() {
          var event = $.Event('keydown', {
            keyCode: 40 // DOWN
          });

          medium.trigger('editableKeydown', event, $editor);

          var $dropdownItems = $( '.js-mentioner-dropdown-item' );
          $dropdownItems.first().next().hasClass('mentioner__dropdown__item--selected').should.be.true;
        });

        it('goes up successfully when it has a prev sibling', function() {
          var event = $.Event('keydown', {
            keyCode: 38 // UP
          });

          medium.trigger('editableKeydown', event, $editor);

          var $dropdownItems = $( '.js-mentioner-dropdown-item' );
          $dropdownItems.first().hasClass('mentioner__dropdown__item--selected').should.be.true;
        });

        it('inserts the selected option when keyup the RETURN key', function() {
          var event = $.Event('keyup', {
            keyCode: 13 // RETURN
          });

          var selectedItemText = $( '.mentioner__dropdown__item--selected' ).find('p').text();

          medium.trigger('editableKeyup', event, $editor);

          var $input = $editor.find('input');
          $input.val().should.equal(selectedItemText);
        });

        it('inserts a &nbsp; entity after adding a new mention', function() {
          var html = $editor.html();
          var regex = new RegExp('&nbsp;$');

          regex.test(html).should.be.true;
        });

        it('hides the dropdown when one option has been selected', function() {
          var $dropdown = $( '.js-mentioner-dropdown' );
          $dropdown.hasClass('mentioner__dropdown--hidden').should.be.true;
        });

        it('replaces the text by the added mention', function() {
          var text = $editor.text();
          var index = text.indexOf('@S');

          index.should.equal(-1);
        });

      });

      describe('Writing text', function() {
        beforeEach(function() {
          $editor.empty();
          $editor.focus();
        });

        it('shows the dropdown help message when the query is not long enough', function() {
          medium.cleanPaste('@');

          var $dropdownHelpMessage = $( '.js-mentioner-dropdown-help-item' );
          $dropdownHelpMessage.should.exist;
        });

        it('shows the dropdown when the query long enough', function() {
          medium.cleanPaste('@Jon');

          var $dropdown = $( '.js-mentioner-dropdown' );
          $dropdown.hasClass('mentioner__dropdown--hidden').should.be.false;
        });

        it('hides the dropdown when using the key ESC', function() {
          var event = $.Event('keydown', {
            keyCode: 27
          });

          medium.trigger('editableKeydown', event, $editor);

          var $dropdown = $( '.js-mentioner-dropdown' );
          $dropdown.hasClass('mentioner__dropdown--hidden').should.be.true;
        });

      });

      describe('Working with the public API', function() {
        before(function() {
          $editor.empty();
          $editor.focus();
        });

        describe('#getMentions', function() {

          it('returns an empty array when there aren\'t any inserted mentions', function() {
            var mentions = $editor.mentioner('getMentions');
            mentions.should.eql([]);
          });

          it('returns the collection of inserted mentions', function() {
            medium.cleanPaste('@J');
            medium.trigger('editableKeyup', $.Event('keyup', { keyCode: 13 }), $editor);

            var mentions = $editor.mentioner('getMentions');
            mentions.length.should.equal(1);
          });

        });

        describe('#serialize', function() {

          it('serializes the content of the editor and returns its HTML', function() {
            medium.cleanPaste('serialize me!');
            var html = $editor.mentioner('serialize');
            var expectedHtml = $editor.html();

            html.should.equal(expectedHtml);
          });

        });

        describe('#triggerMention', function() {

          it('pastes a mentionSymbol and show the dropdown with the help message', function() {
            var $dropdown = $( '.js-mentioner-dropdown' );

            $editor.mentioner('triggerMention');

            $dropdown.hasClass('mentioner__dropdown--hidden').should.be.false;
            $dropdown.find('.js-mentioner-dropdown-help-item').should.exist;
          });
        });
      });
    });
  });
}(jQuery));
