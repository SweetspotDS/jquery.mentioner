(function ($) {
  describe('jQuery#mentioner', function() {
    var elems;

    beforeEach(function() {
      elems = $('.js-textareas-collection').children();
    });

    it('is chainable', function () {
      elems.mentioner().should.equal(elems);
    });

    it('has mentioner data', function() {
      elems.mentioner({ mock: "data" }).each(function() {
        $(this).data('mentioner').should.exist;
      });
    });
  });
}(jQuery));
