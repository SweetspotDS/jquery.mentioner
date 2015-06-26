# jquery.mentioner

A brand-new plugin for mentioning users by using jQuery and the [MediumEditor](https://github.com/yabwe/medium-editor).

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
| maxMentionablesToShow | 5 | Maximum number of results shown on the dropdown |
| mentionSymbol | @ | Symbol for triggering the mentions search |
| requester | `undefined` | Function for requesting the mentionables collection |
| matcher | Function for matching by different parts of the user's name | Function for defining how to select the results from the mentionables collection |

## API

| Method | Return Type | Description |
| ------ | :---------: | ----------- |
| `serialize` | `String` | Returns an HTML which represents the content of the mentioner container. |
| `getMentions` | `Array` | Returns an array with the collection of inserted mentions. Each mention is represented with the same object that its related mentionable. |

## Development

+info: [CONTRIBUTING](contributing.md).

## License

MIT © MediaSQ
