"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, showDeleteBtn = false, showEditBtn = false) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();

  // if a user is logged in, show favorite/not-favorite star
  const showStar = Boolean(currentUser);

  return $(`
      <li id="${story.storyId}">

        ${showDeleteBtn ? getDeleteBtnHTML() : ""}
        ${showStar ? getStarHTML(story, currentUser) : ""}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>

        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;

        ${showEditBtn ? getEditBtnHTML() : ""}

      </li>
  `);
}  

/** Make Edit button HTML to edit story */
function getEditBtnHTML(){
  return `<a href="#" class="story-edit">Edit</a>`;
}

/** Make delete button HTML for story */

function getDeleteBtnHTML() {
  return `
      <span class="trash-can">
        <i class="fas fa-trash-alt"></i>
      </span>`;
}

/** Make favorite/not-favorite star for all stories */

function getStarHTML(story, user) {
  const isFavorite = user.isFavorite(story);
  const starType = isFavorite ? "fas" : "far";

  return `
      <span class="star">
        <i class="${starType} fa-star"></i>
      </span>`;
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

/** Function to create a new story 
 * and put that story on the DOM by calling function "putStoriesOnPage()" in stories.js
 *  and is called when user submits the "create story form"
 * and it calls "addStory()" in model.js StoryList Class
 */

async function createNewStory(e) {

  e.preventDefault();

  // getting the user entered details from the form to create a story
  const author = document.querySelector("#create-author").value;
  const title = document.querySelector("#create-title").value;
  const url = document.querySelector("#create-url").value;
  

  const newStory = await storyList.addStory(currentUser, { title, author, url });

  putStoriesOnPage();

  // hide the form and reset it
  $('#submit-form').slideUp("slow");
  $('#submit-form').trigger("reset");
}

submitForm.addEventListener("submit", createNewStory);

/******************************************************************************
 * Functionality for favorites list and starr/un-starr a story
 */

/** Put favorites list on page. */

function putFavoritesListOnPage() {
  console.debug("putFavoritesListOnPage");

  $favoritedStories.empty();

  if (currentUser.favorites.length === 0) {
    $favoritedStories.append("<h5>No favorites added!</h5>");
  } else {
    // loop through all of users favorites and generate HTML for them
    for (let story of currentUser.favorites) {
      const $story = generateStoryMarkup(story);
      $favoritedStories.append($story);
    }
  }

  $favoritedStories.show();
}

/** Handle favorite/un-favorite a story */

async function toggleStoryFavorite(evt) {
  console.debug("toggleStoryFavorite");

  const $tgt = $(evt.target);
  const $closestLi = $tgt.closest("li");
  const storyId = $closestLi.attr("id");
  const story = storyList.stories.find(s => s.storyId === storyId);

  // see if the item is already favorited (checking by presence of star)
  if ($tgt.hasClass("fas")) {
    // currently a favorite: remove from user's fav list and change star
    await currentUser.removeFavorite(story);
    $tgt.closest("i").toggleClass("fas far");
  } else {
    // currently not a favorite: do the opposite
    await currentUser.addFavorite(story);
    $tgt.closest("i").toggleClass("fas far");
  }
}

$storiesLists.on("click", ".star", toggleStoryFavorite);

/******************************************************************************
 * Functionality for list of user's own stories
 */

 function putUserStoriesOnPage() {
  console.debug("putUserStoriesOnPage");

  $ownStories.empty();

  if (currentUser.ownStories.length === 0) {
    $ownStories.append("<h5>No stories added by user yet!</h5>");
  } else {
    // loop through all of users stories and generate HTML for them
    for (let story of currentUser.ownStories) {
      let $story = generateStoryMarkup(story, true, true);
      $ownStories.append($story);
    }
  }

  $ownStories.show();
}

/** Handle deleting a story. */

// to delete a story we require current user and the storyID we want to delete

async function deleteStory(evt) {
  console.debug("deleteStory");

  // getting the storyID for the story we want to delete
  const $closestLi = $(evt.target).closest("li");
  const storyId = $closestLi.attr("id");

  await storyList.removeStory(currentUser, storyId);

  // re-generate story list
  putUserStoriesOnPage();
}

$ownStories.on("click", ".trash-can", deleteStory);

/** Handle Editing a story */

// To edit a story we require storyID we want to edit

async function updateStory(user, storyID, closestLi) {


   // getting the user entered details from the form to create a story
   let author = document.querySelector("#edit-author").value;
   let title = document.querySelector("#edit-title").value;
   let url = document.querySelector("#edit-url").value;
   
  // Based on the user input whether author or title or url or any combination we pass the request
  if (author !== '') {
    const editStory = await storyList.editStory(user, storyID, { author });
  }

  if (title !== '') {
    const editStory = await storyList.editStory(user, storyID, { title });
  }

  if (url !== '') {
    const editStory = await storyList.editStory(user, storyID, { url });
  }

  // re-generate story list
  putUserStoriesOnPage();

  // hide the form and reset it
  $('#edit-form').slideUp("slow");
  $('#edit-form').trigger("reset");
}


/** When user clicks on "edit" link on a story */
function editClick(e) {

  // getting the storyID for the story we want to edit
  const closestLi = e.target.closest("li");
  const storyId = closestLi.getAttribute("id");

  hidePageComponents();
  $("#edit-form").show();

  $("#edit-form").on("submit",function (e) {
    e.preventDefault();
    updateStory(currentUser, storyId, closestLi);
  });
}
$ownStories.on("click", ".story-edit", editClick);