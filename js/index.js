var username;
var database;
var source;
var url;
var styles;

$(document).ready(function() {
    document.addEventListener('deviceready', deviceready);
})

function deviceready() {
    var currentUsername = localStorage.getItem("username");
    if (currentUsername != 'undefined' && currentUsername != null) {
        $('#username_field').attr("value", currentUsername);
    }
    //INITIALIZING FIREBASE
    var config = {
        apiKey: "AIzaSyDFvI4Wa2Re2F2OyWaqoGvw8lK1SjNXuBA",
        authDomain: "savestyle-81bf4.firebaseapp.com",
        databaseURL: "https://savestyle-81bf4.firebaseio.com",
        storageBucket: "savestyle-81bf4.appspot.com",
        messagingSenderId: "457015776359"
    };
    firebase.initializeApp(config);
    database = firebase.database();

    showpage('login_page');
    $("#login_button").click(function() {
        username = $('#username_field').val();
        localStorage.setItem("username", username);
        setuplistpage();
        return false;
    });
    $("#fab").click(function() {
        showpage('add_new_page');
    });
    $("#find_style_button").click(function() {
        findstyle();
        return false;
    });
    $("#add_new_page .main_nav_icon").click(function(){
      showpage('list_page');
    });
    $("#review_page .main_nav_icon").click(function(){
      showpage('add_new_page');
    });
    $("#saved_style_page .main_nav_icon").click(function(){
      showpage('list_page');
    });
}

//List page
function setuplistpage() {
    var ref = database.ref('styles/' + username);
    ref.on('value', gotFirebaseData, errData);
}
function gotFirebaseData(data) {
    styles = data.val();
    if (styles) {
        $('#intro_text').css('display', 'none');
        $('#style_list').empty();
        console.log(styles);
        var keys = Object.keys(styles);
        for (k = keys.length - 1; k >= 0; k--) {
            $('#style_list').append('<div class="card" id = "' + styles[keys[k]].source + '">');
            $('#' + styles[keys[k]].source).append('<div class="card_header clearfix"><h4>' + styles[keys[k]].source + '</h4><div class="color_preview_tiles"></div></div>');
            for (j = 0; j < 6 && j < styles[keys[k]].colors.length; j++) {
                var random_color = styles[keys[k]].colors[Math.floor(Math.random() * styles[keys[k]].colors.length)];
                $('#' + styles[keys[k]].source + ' .color_preview_tiles').append('<div class="color_tile ' + random_color.slice(1) + '"></div>')
                $("." + random_color.slice(1)).css('background-color', random_color);
            }
            for (l = 0; l < 10 && l < styles[keys[k]].fonts.length; l++) {
                if (l == styles[keys[k]].fonts.length - 1 || l == 9) {
                    $('#' + styles[keys[k]].source).append('<p class="font_info">' + styles[keys[k]].fonts[l] + '</p>');
                } else {
                    $('#' + styles[keys[k]].source).append('<p class="font_info">' + styles[keys[k]].fonts[l] + ', &nbsp' + '</p>');
                }
            }
            $('#' + styles[keys[k]].source).click(function(){
              for(s = 0 ; s < keys.length ; s++){
                if(styles[keys[s]].source == this.id){
                  setupdetailspage(keys[s]);
                }
              }
            })
        }

    } else {
        $('#intro_text').css('display', 'block');
    }
    showpage('list_page');
}
function errData(err) {
    console.log(err);
}

//Review Page
function findstyle() {
    url = $("#url_field").val();
    if (valid(url)) {
        getsource();
        if (!source_check()) {
            setupreviewpage();
        }
        var query = {
            'url': url
        }
        $.ajax({
            type: 'POST',
            dataType: "json",
            url: 'https://savestyle.herokuapp.com/scrapecolor',
            data: query,
            success: function(data) {
                gotData(data);
            }
        });
    } else {
        $('.form_error').css('display', 'block');
    }
}

function source_check() {
    var keys = Object.keys(styles);
    for (p = 0; p < keys.length; p++) {
        if (styles[keys[p]].source == source) {
            setupdetailspage(keys[p]);
            return true;
        }
    }
    return false;
}

function setupreviewpage() {
    $('#loading_animation').css('display', 'block');
    $('#content').css('display', 'none');
    $('#review_page .page_heading').html(source);
    showpage('review_page');
}

function getsource() {
    if (url.indexOf('www') == -1) {
        if (url.indexOf('https') == -1) {
            source = url.split(".")[0].slice(7);
        } else {
            source = url.split(".")[0].slice(8);
        }
    } else {
        source = url.split(".")[1];
    }
    return source;
}

function gotData(data) {
    $('#content').css('display', 'block');
    $('#loading_animation').css('display', 'none');
    display_fonts_and_colors(data, 'review_page');
    $('#savestyle').click(function() {
        var ref = database.ref('styles/' + username);
        var data_tofirebase = {
            source: source,
            colors: data.colors,
            fonts: data.fonts,
            url: url
        }
        ref.push(data_tofirebase);
        setuplistpage();
    });
}

function valid(url) {
    var url_regex = /https?:\/\/*/;
    console.log(url_regex.test(url));
    return url_regex.test(url);
}

function setupdetailspage(firebase_id) {
    // $('#saved_style_content').empty();
    $('#saved_style_page .page_heading').html(styles[firebase_id].source);
    display_fonts_and_colors(styles[firebase_id], 'saved_style_page');
    $('#visit_site').click(function() {
        window.open(styles[firebase_id].url, '_blank')
    });
    showpage('saved_style_page');
}

function display_fonts_and_colors(data, page_id) {
  $('#' + page_id + ' .color_palette').empty();
  $('#' + page_id + ' .font_list').empty();
  $('#' + page_id + ' .font_list').append('<h2> Fonts in ' + data.source + '</h2>');
    for (i = data.colors.length - 1; i >= 0; i--) {
        $('#' + page_id + ' .color_palette').append('<div class="color_tile_big ' + data.colors[i].slice(1) + '">' + data.colors[i] + '</div>');
        $("." + data.colors[i].slice(1)).css('background-color', data.colors[i]);
        if (i < data.colors.length / 2) {
            $("." + data.colors[i].slice(1)).css('color', '#f0f0f0');
        } else {
            $("." + data.colors[i].slice(1)).css('color', '#212121');
        }
        // if(isdark(data.colors[i])){
        //   $(data.colors[i]).css('color', '#f0f0f0');
        // }
        // else{
        //   $(data.colors[i]).css('color', '#212121');
        // }
    }
    for (j = 0; j < data.fonts.length; j++) {
        $('#' + page_id + ' .font_list').append('<p>' + data.fonts[j] + '</p>');
    }
}

//Page navigation
function showpage(switchtopage) {
    window.scrollTo(0, 0);
    var login_page = $('#login_page');
    var list_page = $('#list_page');
    var add_new_page = $('#add_new_page');
    var review_page = $('#review_page');
    var saved_style_page = $('#saved_style_page');
    switch (switchtopage) {
        case 'login_page':
            login_page.css('display', 'block');
            list_page.css('display', 'none');
            add_new_page.css('display', 'none');
            review_page.css('display', 'none');
            saved_style_page.css('display', 'none');
            break;
        case 'list_page':
            login_page.css('display', 'none');
            list_page.css('display', 'block');
            add_new_page.css('display', 'none');
            review_page.css('display', 'none');
            saved_style_page.css('display', 'none');
            break;
        case 'add_new_page':
            login_page.css('display', 'none');
            list_page.css('display', 'none');
            add_new_page.css('display', 'block');
            review_page.css('display', 'none');
            saved_style_page.css('display', 'none');
            break;
        case 'review_page':
            login_page.css('display', 'none');
            list_page.css('display', 'none');
            add_new_page.css('display', 'none');
            review_page.css('display', 'block');
            saved_style_page.css('display', 'none');
            break;
        case 'saved_style_page':
            login_page.css('display', 'none');
            list_page.css('display', 'none');
            add_new_page.css('display', 'none');
            review_page.css('display', 'none');
            saved_style_page.css('display', 'block');
            break;
        default:
            console.log("did not find anything");
            return 1;
    }
}

// function isdark(c){
//   var c = c.substring(1); // strip #
//   var rgb = parseInt(c, 16); // convert rrggbb to decimal
//   var r = (rgb >> 16) & 0xff; // extract red
//   var g = (rgb >> 8) & 0xff; // extract green
//   var b = (rgb >> 0) & 0xff; // extract blue
//
//   var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709
//
//   if (luma < 100) {
//       return true;
//   }
//   else {
//     return false;
//   }
// }
