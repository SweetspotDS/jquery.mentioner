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
        var mentionerData = $(this).data('mentioner');
        mentionerData.should.eql({ mock: "data" });
      });
    });
  });
}(jQuery));
