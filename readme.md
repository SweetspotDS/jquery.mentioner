# jquery.mentioner

A brand-new plugin for mentioning users by using jQuery and the [MediumEditor](https://github.com/yabwe/medium-editor).

## Runtime dependencies

* [jQuery](http://jquery.com/)
* [MediumEditor](https://github.com/yabwe/medium-editor)

## Getting Started

```html
<!DOCTYPE html>
<html>
<head>
  <link href="jquery.mentioner.css" rel="stylesheet" type="text/css">
</head>
<body>
  <div class="js-editor"></div>

  <script src="jquery.js"></script>
  <script src="medium-editor.js"></script>
  <script src="jquery.mentioner.js"></script>
  <script>
    var medium = new MediumEditor('.js-editor');

    $( '.js-editor' ).mentioner({
      editor: medium,
      requester: function(callback) {
        var mentionables = [
          // your mentionables
        ];

        callback.call(this, mentionables);
      }
    });
  </script>
</body>
</html>
```

## Options

| Option | Default value | Description |
| ------ | :-------------: | ----------- |
| editor | `undefined` | The related MediumEditor's instance |
| minQueryLength | 1 | Minimun amount of characters needed to trigger the mentions dropdown |
| mentionSymbol | @ | Symbol for triggering the mentions search |
| requester | `undefined` | Function for requesting the mentionables collection |
| matcher | Function for matching by different parts of the user's name | Function for defining how to select the results from the mentionables collection |

## Mentionables

Mentionables are expected to be loaded by using the `requester` function. This function receives a callback that should be invoked once the collection of mentionables is successfully built.

Each mentionable is supposed to be a plain JavaScript object containing the following properties:

| Property | Type | Description |
| -------- | ---- | ----------- |
| name | `String` | Value to be displayed |
| id | `String` | Unique identifier for each mentionable |
| $avatar | `jQuery` | A jQuery object representing an avatar (i.e. `img`) |

Every additional property will be also returned when retrieving the inserted mentions.

```js
requester: function(callback) {
  var mentionables = [
    {
      $avatar: $('<img src="whatever" />'),
      company: 'The Wall',
      name: 'Jon Snow',
      id: '1'
    }
  ];

  callback(mentionables);
}
```

## API

| Method | Return Type | Description |
| ------ | :---------: | ----------- |
| `serialize` | `String` | Returns an HTML which represents the content of the mentioner container. |
| `getMentions` | `Array` | Returns an array with the collection of inserted mentions. Each mention is represented with the same object that its related mentionable. |
| `triggerMention` | `undefined` | When the mentioner is focused, it pastes the mentionSymbol and trigger the dropdown. |

## Development

+info: [CONTRIBUTING](contributing.md).

## License

MIT © MediaSQ
