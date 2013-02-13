(function(){
    var github_api_url = 'https://api.github.com/orgs/ebayopensource/',
        item_tmpl = $('#repo-item').html(),
        reposDiv = $('#repos'),
        membersDiv = $('#members');

    var my = {

        processRepoResponse: function(resp){
            debugger;
            reposDiv.html(Mustache.to_html(item_tmpl, {repos: resp.data}));
        },

        loadRepos: function(){
            $.ajax({
                url: github_api_url + 'repos',
                dataType: 'jsonp',
                success: my.processRepoResponse,
                context: my
            });
        },

        getMembers: function(){
            $.ajax({
                url: github_api_url + 'members',
                dataType: 'jsonp',
                success: function(resp){
                    var members = resp.data;
                    if (members){
                        membersDiv.html(members.length + " Members");
                    }
                },
                context: my
            });
        },

        init: function(){
            my.loadRepos();
            my.getMembers();
        }
    };

    my.init();


})();
