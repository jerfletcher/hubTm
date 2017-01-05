# hubTm
    Packager for browser js, css, html

![alt text](https://docs.google.com/drawings/d/1Vv341Zr22ccehyCmahUQ7_kXvsVZk4JSXFoj44y45FM/pub?w=452&h=719 "Architecture")


## Goals
*   Brand and Team independent (distinct repos)
*   Ads (MPS) and DTM script replacement
*   Easy dev and test setup
*   Programmatically specify dependencies
*   Minify option
*   Release tracking (via Git releases)
*   Facilitate code reuse
*   Respect file extensions (.js, .css, .html)
*   Shared logic for display/launch rules
*   Nice to have: Introspection via browser console
*   Nice to have: Analytics
    

## Installation

    git clone https://github.com/jerfletcher/hubTm
    vagrant up --provision
    vagrant ssh
    cd /vagrant
    npm install

## Build a Bundle
    node bundle [project] [-dev]
    ex. node bundle today -dev

## Next Steps
*   Incorporate actual Ad code
*   add relative path imgs to dist
*   automate deployment
*   Refactor display/launch rules (optionsManager)
*   Create NPM component and split repo
*   Work with Ops on deployemnt process (Github release mechanism + server buildout + file copy + redirect)
*   Lazy loading mechanism
