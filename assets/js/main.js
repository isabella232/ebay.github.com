(function ($) {
  $(document).ready(function(){
	
	$('.flexslider').flexslider({
		animation: "slide"
	});

    // hide .navbar first
    $("#topnav").hide();

    // fade in .navbar
    $(function () {
        $(window).scroll(function () {

                 // set distance user needs to scroll before we start fadeIn
            if ($(this).scrollTop() > 100) {
				
                $('#topnav').fadeIn();
            } else {
                $('#topnav').fadeOut();
            }
        });
    });

});
  }(jQuery));


