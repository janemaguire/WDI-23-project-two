# Time Travlr

by: 

<a href="https://github.com/olifen">Oliver Fennelly</a>
<br>
<a href="https://github.com/michaelstoneg">Michael Grandison</a>
<br>
<a href="ttps://github.com/janemaguire">Jane Maguire</a>
<br>
<a href="https://github.com/Whitmey">Will Whitmey</a>
<br>



##What is it?


Time Travlr is an educational web app that takes you on a journey through time and space to explore significant historical events.

Using Google Maps and Wikipedia, Time Travlr invites users to explore the geography and history of different places, providing information on the most important events of the time.

Our app presents a range of times and places, something inspired by the diversity of historical interests held by the dev team.

Get the App:
<br>
<a href="http://timetravlr.herokuapp.com">Time Travlr</a>


##How does it work?


The user has been mysteriously catapulted back in time and must find their way to the present by finding hidden time portals.

Users must first login or reigster to gain access. Once in, a stylized map is displayed, populated by markers for various historical events. When clicked markers give information as well as a link to even more information via Wikipedia.

The more events the user explores, the more clues they recieve to the location of the hidden time portal. You can search the map for portals by simply clicking around. Your location is displayed bottom right, along with how far away you are from a portal. Once you find a time portal you will warp through time to a new period in history. Travelling through all the portals will eventually return the user to their present time and location.


##How did it come to be? 

When we were initially challenged with bulding a map based web app the first ideas to emerge were: an events app, a historical map, and a gamified experience. The final product is a synthesis of all three. 

At the outset, many features were suggested. To manage this we made use of a team Trello Board. We especially used this for detailing our user story. Balsamic was also used for wireframing. Almost all of the proposed features were added to what you see today. 

<a href="https://trello.com/b/yPg6kkR9/project2-time-travlr">Team Trello</a><br>
<a href="https://generalassembly.mybalsamiq.com/projects/wdi-ldn-23/Project%202">Wireframes</a>


First we lay the ground work by creating a RESTful API for our historical event resource, complete with authentication. Then came implementing game logic with a few sample events. Next came the content. Each member of the time chose a time period and location to research and create a level around. Finally we polished the product by adding menus of various styles, maps of various colour schemes using Snazzy Maps, period specifc icons and transition visuals.

This project presented challenges including:

Integrating events with Wikipedia API<br>
Correctly displaying info windows<br>
Displaying information from a seed file<br> 
Managing all the varibales at play<br>
Ajax calls and response times<br>
Wikipedia database queries<br>
Calculating distances on Google Maps<br>

Through collaboration and the help of truly great instructors, we were able to overcome these challenges and produce a satisfying piece of work.



## Technologies used:

JavaScript ES6<br>
jQuery<br> 
Ajax<br> 
Node.js<br> 
Express<br>
Google Maps JavaScript API: Geometry, Geolocation, Event listening<br>
Wikipedia API: Query search<br> 
Custom RESTful API for historical events<br>
Balsamic for wireframes<br>
Heroku for deployment<br>
Bootstrap<br>
Github<br>
Packages: Gulp, Mongoose, Json Web Token, Validator, Bcrypt
 


