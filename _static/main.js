"use strict";

function toggleNavClass(e){
    let nvbr = document.querySelector(".navbar");

    if(e.target.getAttribute("aria-expanded") === "false"){
        nvbr.classList.add("menu-open");
    }else{
        nvbr.classList.remove("menu-open");
    }
}

function assessClick(e){
    let nvbr = document.querySelector(".navbar");
    if(!e.target.classList.contains(".dropdown-toggle")){
        nvbr.classList.remove("menu-open");
    }
}

// toggle class when opening dropdowns - this keeps the navbar black even when hovering off
let drops = document.querySelectorAll(".nav-link.dropdown-toggle");
for(let i=0;i<drops.length;i++){
    drops[i].addEventListener("click", toggleNavClass);
}

// if clicking anywhere else but a dropdown trigger, remove class
window.addEventListener("click", assessClick);