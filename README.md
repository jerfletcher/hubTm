# hubTm
    Packager for browser js, css, html

## Goals
    *   Brand Platform independent
    *   Easy dev and test setup
    *   Respect file extensions (.js, .css, .html)
    *   Minify option
    *   Release tracking (via Git releases)
    *   Programmatically specify dependencies
    *   Facilitate code reuse
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
