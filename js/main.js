(function() {
    var base_url = 'file:///Users/jbrittain/vc/ebay.github.com';
    var ebay_org_projects = { 'projects': [
        { 'org':'ebay', 'repo':'*', 'ebayOrg':'eBay Marketplaces' },
        { 'org':'ebaysf', 'repo':'*', 'ebayOrg':'eBay Marketplaces' },
        { 'org':'ebayopensource','repo': '*', 'ebayOrg':'eBay Marketplaces' },
        { 'org':'raptorjs', 'repo':'*', 'ebayOrg':'eBay Marketplaces' },
        { 'org':'ql-io', 'repo':'*', 'ebayOrg':'eBay Marketplaces' }
        /* Don't show non-Marketplaces orgs without their permission..
        { 'org':'paypal', 'repo':'*', 'ebayOrg':'PayPal' },
        { 'org':'xcommerce', 'repo':'*', 'ebayOrg':'X.commerce' },
        { 'org':'magento', 'repo':'*', 'ebayOrg':'Magento' }
        */
    ]};

    // ebay_contributed_projects: a list of isolated individual OSS projects
    // hosted in another org on github, where this list contains each project's
    // github org and repo names.
    var ebay_contributed_projects = { 'projects': [
        /*{ 'org': '', 'repo': '', 'ebayOrg': 'eBay Marketplaces' }*/
    ]};

    var github_api_url = 'https://api.github.com/';
    var item_tmpl = $('#repo-item').html();
    var repos_div = $('#repos');
    var forked_from_tmpl = $('#forked-from').html();
    var forked_html = '';
    var members_div = $('#members');
    var repos = [];
    var total_members = 0;

    var my = {

        getRepoMembers: function(owner, name) {
            $.ajax({
                url: github_api_url + 'repos/' + owner + '/' + name
                     + '/collaborators',
                dataType: 'jsonp',
                success: function(resp) {
                    var members = resp.data;
                    if (members) {
                        members_div.html(members.length + " Members");
                    }
                },
                context: my
            });
        },

        processRepoResponse: function(resp) {
            var repo = resp;
            if (repo.fork == true) {
                forked_html = Mustache.to_html(forked_from_tmpl, {
                    forked_parent_org: repo.parent.owner.login, 
                    fork_parent_name: repo.parent.name
                });
                repo.forked_html = forked_html;

                $.ajax({
                    url: github_api_url + 'repos/' + org + '/' + repo + '/pulls',
                    dataType: 'jsonp',
                    success: function() {
                        repo.pulls_count = resp.data.length;
                        async_requests--;
                    },
                    context: my
                });
            }

            repos.push(repo);

            repos_div.html(Mustache.to_html(item_tmpl, {repos: repos}));
        },

        processRepoArrayResponse: function(resp) {
            for (var i = 0; i < resp.data.length; i++) {
                my.processRepoResponse(resp.data[i]);
            }
        },

        loadRepos: function(data) {
            var projects = data.projects;
            for (var i = 0; i < projects.length; i++) {
                var org = projects[i].org;
                var repo = projects[i].repo;
                if (repo == '*') {
                    $.ajax({
                        url: github_api_url + 'orgs/' + org + '/repos',
                        dataType: 'jsonp',
                        success: my.processRepoArrayResponse,
                        context: my
                    });
                } else {
                    $.ajax({
                        url: github_api_url + 'repos/' + org + '/' + repo,
                        dataType: 'jsonp',
                        success: my.processRepoResponse,
                        context: my
                    });
                }
            }
        },

        init: function() {
            my.loadRepos(ebay_org_projects);
            //my.loadRepos(ebay_contributed_projects);
        }
    };

    my.init();

})();
