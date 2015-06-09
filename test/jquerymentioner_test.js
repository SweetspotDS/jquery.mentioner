(function ($) {
  module('jQuery#jquery.mentioner', {
    setup: function () {
      this.elems = $('#qunit-fixture').children();
    }
  });

  test('is chainable', function () {
    expect(1);
    strictEqual(this.elems.jquery.mentioner(), this.elems, 'should be chainable');
  });

  test('is jquery.mentioner', function () {
    expect(1);
    strictEqual(this.elems.jquery.mentioner().text(), 'jquery.mentioner0jquery.mentioner1jquery.mentioner2', 'should be jquery.mentioner');
  });

}(jQuery));
