"use strict";

const socialLinks = document.querySelector(".social-links");
const allCards = document.querySelectorAll(".card-custom");
const portfolioSection = document.querySelector(".portfolio");
const overlay = document.querySelector(".my_overlay");
const rowProjects = document.querySelector(".row_projects");
const closingBtns = document.querySelectorAll(".closing_btn");
const allModals = document.querySelectorAll(".my_modal");
const allTabs = document.querySelectorAll(".tab");
const allDescriptions = document.querySelectorAll(".description");
const body = document.querySelector("body");
const header = document.querySelector(".header");
const navigation = document.querySelector(".navbar-custom");
const formButton = document.querySelector(".form-button");
const contactForm = document.querySelector(".contact_form");
const firstInput = document.querySelector(".first-input");
const backToTopButton = document.querySelector(".back-to-top");
const modalButton = document.querySelector(".form-modal-btn");

// navigation functionality (we display the navigation when the header is no longer in view)

const navigationHeight = navigation.getBoundingClientRect().height;

const makeNavbarSticky = function (entries) {
  const [entry] = entries;
  if (!entry.isIntersecting) {
    navigation.classList.add("sticky-top", "navbar-visible");
  } else {
    navigation.classList.remove("sticky-top");
  }
};

const options = {
  root: null,
  threshold: 0,
  rootMargin: `-${navigationHeight + 50}px`,
};

const headerObserver = new IntersectionObserver(makeNavbarSticky, options);
headerObserver.observe(header);

// navigation - closing the navigation when clicking outside
document.addEventListener("click", function (e) {
  const clickedEl = e.target;
  if (!navigation.contains(clickedEl)) {
    document.querySelector(".navbar-collapse").classList.remove("show");
  }
});

function runTypingEffect() {
  const text = "I am Daniel Deaconescu";
  const typingElement = document.getElementById("typing-text");
  const typingDelay = 100;

  typeText(text, typingElement, typingDelay);
}

function typeText(text, typingElement, delay) {
  for (let i = 0; i < text.length; i++) {
    setTimeout(() => {
      typingElement.textContent += text.charAt(i);
    }, delay * i);
  }
}

document.addEventListener("DOMContentLoaded", runTypingEffect);

// links effect
const opacityChanger = function (e) {
  if (e.target.classList.contains("social-link")) {
    const link = e.target;
    const siblings = link
      .closest(".social-links")
      .querySelectorAll(".social-link");
    siblings.forEach((el) => {
      if (el !== link) el.style.opacity = this;
    });
  }
};

socialLinks.addEventListener("mouseover", opacityChanger.bind(0.5));
socialLinks.addEventListener("mouseout", opacityChanger.bind(1));

// displaying icons when the resolution is below 578px
function checkScreenWidth() {
  const socialLinksMobile = document.querySelector(".social-links-mobile");
  const socialLinksLarge = document.querySelector(".social-links");

  if (window.matchMedia("(max-width: 577px)").matches) {
    socialLinksMobile.style.display = "block";
    socialLinksLarge.style.display = "none";
  } else {
    socialLinksMobile.style.display = "none";
    socialLinksLarge.style.display = "block";
  }
}

// Check on load
checkScreenWidth();

// Add an event listener to detect screen resize
window.addEventListener("resize", checkScreenWidth);

// modal functionality

// create a function that opens a modal based on the specified number
// const openModal = function (modalNumber) {
//   const correspondingModal = document.querySelector(
//     `.my_modal[data-modal="${modalNumber}"]`
//   );
//   correspondingModal.classList.remove("display-none");
//   correspondingModal.scrollIntoView({ behavior: "smooth", block: "start" });
//   overlay.classList.remove("display-none");
//   document.querySelector("body").style.overflowY = "hidden";
// };

// create a function that checks which modal is currently open and returns its data-project
// const closeModal = function () {
//   // check which modal does not have the "displayy-none" class
//   const visibleModal = document.querySelector(".my_modal:not(.display-none)");
//   if (visibleModal) visibleModal.classList.add("display-none");
//   overlay.classList.add("display-none");
//   document.querySelector("body").style.overflowY = "auto";
// };

allCards.forEach((card) => {
  card.addEventListener("click", function (e) {
    const clickedCard = e.target.closest(".card").dataset.project;
    openModal(clickedCard);
  });
});
// closing modal when clicking the overlay
// overlay.addEventListener("click", closeModal);
// closing modal when clicking "X" mark
closingBtns.forEach((closingBtn) =>
  closingBtn.addEventListener("click", closeModal)
);
// closing modal when hitting the "Esc" button
document.addEventListener("keydown", function (e) {
  // check if there is a modal open
  allModals.forEach((modal) => {
    if (!modal.classList.contains("display-none") && e.key === "Escape") {
      closeModal();
    }
  });
});

// tabbed component functionality
const tabsContainer = document.querySelector(".tabs-container");
const tabs = document.querySelectorAll(".tab");
const tabsContent = document.querySelectorAll(".description");

tabsContainer.addEventListener("click", function (e) {
  const clicked = e.target.closest(".tab");

  if (!clicked) return;

  tabs.forEach((e) => e.classList.remove("tab_active"));
  tabsContent.forEach((c) => c.classList.remove("description-active"));

  clicked.classList.add("tab_active");

  document
    .querySelector(`.description[data-tech="${clicked.dataset.tech}"]`)
    .classList.add("description-active");
});

// scrolling functionality

// const aboutMeBtn = document.querySelector(".about-me-test");
// aboutMeBtn.addEventListener("click", function (e) {
//   e.preventDefault();

//   const target = this.getAttribute("href").substring(1);
//   const targetSection = document.getElementById(target);

//   const navHeight = document
//     .querySelector(".navbar")
//     .getBoundingClientRect().height;
//   const scrollPosition = targetSection.offsetTop - navHeight;

//   window.scrollTo({
//     top: scrollPosition,
//     behavior: "smooth",
//   });
// });

const allNavLinks = document.querySelectorAll(".link-custom");
allNavLinks.forEach((item) => {
  item.addEventListener("click", function (e) {
    e.preventDefault();
    const targetID = this.getAttribute("href").substring(1);
    const targetSection = document.getElementById(targetID);
    // we need to scroll down up until the top of each section - the height of the navigation bar
    console.log(targetID);

    // const navHeight = document
    //   .querySelector(".navbar")
    //   .getBoundingClientRect().height;
    let scrollPosition;

    if (targetID === "my-skills") {
      scrollPosition = targetSection.offsetTop - (navigationHeight + 40);
    } else {
      scrollPosition = targetSection.offsetTop - navigationHeight;
    }

    window.scrollTo({
      top: scrollPosition,
      behavior: "smooth",
    });
  });
});

const closeForm = function () {
  contactForm.classList.add("display-none");
  overlay.classList.add("display-none");
  contactForm.reset();
};

const checkIfFormIsOpen = function () {
  return contactForm.classList.contains("display-none") ? false : true;
};

// Form button functionality
// formButton.addEventListener("click", function () {
//   contactForm.classList.toggle("display-none");
//   overlay.classList.toggle("display-none");
//   checkIfFormIsOpen();
//   const isFormOpen = checkIfFormIsOpen();

//   if (isFormOpen) {
//     navigation.classList.add("display-none");
//     firstInput.focus();
//   } else {
//     navigation.classList.remove("display-none");
//     contactForm.reset();
//   }
// });

// closing the form when clicking outside
// overlay.addEventListener("click", function () {
//   closeForm();
//   const isFormOpen = checkIfFormIsOpen();
//   isFormOpen
//     ? navigation.classList.add("display-none")
//     : navigation.classList.remove("display-none");
// });

// // closing the form with the "Esc" key
// document.addEventListener("keydown", function (e) {
//   if (e.key === "Escape") closeForm();
//   const isFormOpen = checkIfFormIsOpen();
//   isFormOpen
//     ? navigation.classList.add("display-none")
//     : navigation.classList.remove("display-none");
// });

// Closing Prompt Functionality
const workInProgressPrompt = document.querySelector(
  ".work-in-progress-info-note"
);
const closingButton = document.querySelector(".closing-button");

if (localStorage.getItem("workInProgressClosed") === "true") {
  workInProgressPrompt.classList.add("d-none");
}

closingButton.addEventListener("click", function () {
  workInProgressPrompt.classList.add("d-none");

  localStorage.setItem("workInProgressClosed", "true");
});

// Back to top functionality
backToTopButton.addEventListener("click", function () {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});

function windowScroll() {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      backToTopButton.classList.remove("no-display");
    } else {
      backToTopButton.classList.add("no-display");
    }
  });
}

document.addEventListener("DOMContentLoaded", windowScroll);

// Form handling

// 1. Toast Controller
const showToast = (message, isError = false) => {
  const toast = document.getElementById("toast");
  toast.className = isError ? "toast-error" : "toast-success";
  toast.textContent = message;
  toast.classList.add("toast-visible");

  setTimeout(() => {
    toast.classList.remove("toast-visible");
  }, 3000);
};

showToast("Message sent successfully!");

// 2. Form Validation

const validateForm = (form) => {
  const errors = [];
  const fields = [
    {
      name: "name",
      label: "Full Name",
    },
    {
      name: "company-name",
      label: "Company Name",
    },
    {
      name: "email",
      label: "Email",
    },
    {
      name: "message",
      label: "Message",
    },
  ];

  // If one of these fields is missing, throw an error
  fields.forEach((field) => {
    if (!form.elements[field.name].value.trim()) {
      errors.push(`${field.label} is required!`);
    }
  });

  // Add a basic email verification
  const email = form.elements.email.value;

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Please provide a valid email!");
  }

  return errors;
};

// 3. Form submission (we do the Turnstile verification here)
const form = document.getElementById("contactForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;

  // Turnstile Verification
  const turnstileToken = document.querySelector(
    '[name="cf-turnstile-response"]'
  )?.value;

  if (!turnstileToken) {
    showToast("Please complete the CAPTCHA verification", true);
  }

  // Validate
  const errors = validateForm(form);
  if (errors.length > 0) {
    showToast(errors.join(", "), true);
    return;
  }

  const jsonData = {
    name: form.elements.name.value,
    company: form.elements["company-name"].value,
    email: form.elements.email.value,
    message: form.elements.message.value,
    "cf-turnstile-token": turnstileToken,
  };

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jsonData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Request failed");
    }

    showToast("Message sent succefully!");
    form.reset();
    setTimeout(() => {
      window.location.href = "/submitted/contact_form_submitted.html";
    }, 1500);
  } catch (error) {
    console.error("Submission failed: ", error);
    showToast(error.message || "Failed to send message", true);
  }
});
