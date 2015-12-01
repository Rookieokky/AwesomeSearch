$(document).ready(function() {
  var f;
  var d;
  var haveParse = true; // the repos has been parsed or not ?
  var isAwesome = false; // is it sindre/awesome repo ?
  var options = {
    keys: ['name', 'description', 'cate'],
  };
  var $awesome = $('.awesome-block');
  var $searchResult = $('.search-result');
  var $innerDropDownMenu = $('.mui-dropdown__menu');
  var $dropDownMenu = $('.mui-dropdown');

  var getCateList = function(e, cate) {
    var list;
    cate = cate || 'null';
    d = [];
    isAwesome = cate === 'awesome' ? 1 : 0;

    $awesome.addClass('content-hidden');
    $dropDownMenu.removeClass('content-hidden');

    /**
    * Get JSON format of awesome list
    **/
    $.getJSON('https://raw.githubusercontent.com/lockys/awesome.json/master/output/' + cate + '.json', function(data) {
      var backToAwesomeHTML;
      var repoName = 'awesome';

      list = data;
      haveParse = cate !== 'awesome' && true;

      $awesome.html('');
      $searchResult.html('');
      $('.alert').html('');
      $innerDropDownMenu.html('');

      if (!isAwesome) {
        var repoURL = e.url;
        repoName = e.name;

        // Update the title
        $('.cate').html(repoName);

        backToAwesomeHTML = '<a class="back-button"><- Back to Awesome</a><br/><a href="' + repoURL + '" target="_blank">-> Original Repo</a>';
        $awesome.html('Retrieving repo...');

        getReadme(repoURL, function(content) {
          $awesome.html('').append(backToAwesomeHTML).append(content);
          var anchor = $('h3 a, h2 a, h1 a');
          /**
          * Build Category List.
          **/
          for (var i = 0, len = anchor.length; i < len; ++i) {
            anchor[i].id = anchor[i].id.replace('user-content-', '');
            if (anchor[i].id) {
              $innerDropDownMenu.append('<li><a href="#' + anchor[i].id + '">' + $(anchor[i]).parent('h2, h3, h1').text() + '</a></li>');
            }
          }
        });

        $awesome.addClass('awesome-background').removeClass('content-hidden');

        /**
        * Category has not been parsed yet.
        **/
        if (Object.keys(list).length === 0) {
          haveParse = false;
          $('.alert').html('<span style="color: red;">This repo has not been parsed yet, so what you search is awesome repo</span><br/>');
          return;
        }

        /**
        * Fill in to data for searching
        **/
        Object.keys(list).forEach(function(e) {
          d = d.concat(list[e]);
        });
      }else {
        /**
        * show awesome repo
        **/
        Object.keys(list).forEach(function(e) {
          var _cateID = e.replace(/\W/g, '').toLowerCase();
          var title = '<h2 id="' + _cateID + '">' + e + '</h2>';
          d = d.concat(list[e]);

          // Update the title
          $('.cate').html(repoName);

          $innerDropDownMenu.append('<li><a href="#' + _cateID + '">' + e + '</a></li>');
          $awesome.append(title);

          list[e].forEach(function(e) {
            var id = e.name.replace(/\W/g, '').toLowerCase();
            var href = '';
            var link = '';
            var description = e.description ? ' - ' + e.description : '';

            if (!isAwesome) {
              href = ' href="' + e.url + '" ';
            }

            link = '<a class="mui-btn mui-btn--small mui-btn--primary ' + id + '"' + href + 'href="#repos/' + id + '" data-url="' + e.url + '" data-name="' + e.name + '"><span class="mui--text-white" data-url="' + e.url + '" data-name="' + e.name + '">' +  e.name + '</span><span style="color: #7CF1F7" class="" data-url="' + e.url + '" data-name="' + e.name + '">' + description + '</span></a>';
            $awesome.append(link);
          });
        });

        $awesome.removeClass('content-hidden awesome-background');
      }

      f = new Fuse(d, options);
    });
  };

  $('.awesome-input').on('input', function(e) {

    var query = $(this).val();
    $awesome.addClass('content-hidden');
    $searchResult.html('');

    if (!query) {
      $awesome.removeClass('content-hidden');
    }

    var result = f.search(query);
    var link = '';
    var description = '';
    for (var i = 0, len = result.length; i < len; ++i) {
      if (result[i]) {
        var id = result[i].name.replace(/\W/g, '').toLowerCase();
        var href = ' href="' + result[i].url + '" ';
        if (isAwesome) {
          href = '';
        }

        // console.log(d);
        description = result[i].description ? ' - ' + result[i].description + '</br>' : '<br/>';
        if (haveParse) {
          $searchResult.append('<a class="' + id + ' search-repo-link"' + href + 'data-url="' + result[i].url + '" data-name="' + result[i].name + '" target="_blank">' +  result[i].name + '</a>' + description);
        } else {
          $searchResult.append('<a class="' + id + ' search-repo-link" data-url="' + result[i].url + '" data-name="' + result[i].name + '" href="#/repos/' + id + '">' +  result[i].name + '</a>' + description);
        }

      }
    }

  });

  /**
  * @param repoURL
  * @return rawURL
  **/
  function getReadme(repoURL, cb) {
    var maintainer = repoURL.split('/')[3];
    var repo = repoURL.split('/')[4];
    var apiURL = 'https://api.github.com/repos/' + maintainer + '/' + repo + '/readme';

    $.ajax({
      url: apiURL,
      headers: {
        accept: 'application/vnd.github.v3.html',
      },
      success: cb,
    });
  }

  $awesome.click(function(event) {
    if ($(event.target).is('.back-button')) {
      event.preventDefault();
      getCateList(null, 'awesome');
    }
  });

  $('.to-top-arrow').click(function() {
    $('html, body').animate({
      scrollTop: 0,
    }, 600);
    return false;
  });

  var AwesomeRouter = Backbone.Router.extend({
    routes: {
      'repos/:cate': 'getRepos',
    },
  });

  var awesomeRouter = new AwesomeRouter();

  awesomeRouter.on('route:getRepos', function(cate) {
    var repoInfo = {};
    var urlMap = 'https://raw.githubusercontent.com/lockys/awesome.json/master/name-map/name-map.json';
    var awesomeURL = 'https://raw.githubusercontent.com/lockys/awesome.json/master/name-map/awesome.json';

    $.getJSON(urlMap, getAwesome);

    function getAwesome(map) {
      $.getJSON(awesomeURL, function(d) {
        repoInfo = {
              name: map.backword[cate],
              url: d[map.backword[cate]],
            };
        getCateList(repoInfo, cate);
      });

    }

  });

  Backbone.history.start();
  getCateList(null, 'awesome');
});
