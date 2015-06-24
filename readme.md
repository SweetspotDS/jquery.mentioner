# jquery.mentioner

A brand-new plugin for mentioning users by using jQuery and the [MediumEditor](https://github.com/yabwe/medium-editor).

## Getting Started

```html
<!DOCTYPE html>
<html>
<head>
  <link href="dist/jquery.mentioner.css" rel="stylesheet" type="text/css">
</head>
<body>
  <div class="js-editor"></div>

  <script src="jquery.js"></script>
  <script src="medium-editor.js"></script>
  <script src="dist/jquery.mentioner.min.js"></script>
  <script>
    var medium = new MediumEditor('.js-editor');
    $( '.js-editor' ).mentioner({
      editor: medium,
      requester: function() {
        // Function for requesting the data
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

## Development

1. `npm install`
2. `bower install`
3. `grunt serve`

At this moment all the specs should pass: `localhost:9000/test/jquery.mentioner.html`

## License

MIT © MediaSQ
