(function ($) {
  describe('jQuery#mentioner', function() {
    var editor, elems;

    beforeEach(function() {
      editor = new MediumEditor('.js-editor-1', {
        placeholder: false,
        disableToolbar: true
      });

      elems = $('.js-editors').children();
    });

    it('is chainable', function () {
      elems.mentioner({ editor: editor }).should.equal(elems);
    });

    it('has a mentioner object attached', function() {
      elems.mentioner({ editor: editor }).each(function() {
        $(this).data('mentioner').should.exist;
      });
    });
  });
}(jQuery));
