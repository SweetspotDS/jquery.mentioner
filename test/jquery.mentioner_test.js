(function ($) {
  module('jQuery#mentioner', {
    setup: function () {
      this.elems = $('#qunit-fixture').children();
    }
  });

  test('is chainable', function (assert) {
    assert.strictEqual(this.elems.mentioner(), this.elems, 'should be chainable');
  });

  test('has mentioner data', function(assert) {
    this.elems.mentioner({ mock: "data" }).each(function() {
      var mentionerData = $(this).data('mentioner');
      assert.ok(mentionerData, 'should have data');
    });
  });
}(jQuery));
