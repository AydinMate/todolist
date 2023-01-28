//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

mongoose.set('strictQuery', false);
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));


mongoose.connect('mongodb+srv://admin-aydin:Test123@cluster0.uhc6gqd.mongodb.net/toDoListDB');



// Create Schema
const itemsSchema = new mongoose.Schema ({
  name: String,
});

// Create Model
const Item = mongoose.model("Item", itemsSchema);


// Create Collections
const item1 = new Item ({
  name: "Welcome to the todolist!"
});

const item2 = new Item ({
  name: "Hit the '+' button to add a new item."
});

const item3 = new Item ({
  name: "<-- Hit this to delete and item."
});

// Send collections to a list
const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);





app.get("/", function(req, res) {

  Item.find({}, function(err, items) {
    if (items.length === 0) {
      // Send data to server.
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        }
        else {
          console.log("You have successfully updated the Database.");
        }
      });
      res.redirect("/");
    }
    else {
      res.render("list", {listTitle: "Today", newListItems: items});
    }
  
  });


  

});


// Create custom list if you have a new url
app.get("/:customListName", function(req, res){
  const customListName = req.params.customListName;
  List.findOne({ name: customListName }, function(err, foundList) {
    if (err) {
      console.log(err)
    }
    if (foundList) {
      res.render("list", {listTitle: _.capitalize(foundList.name), newListItems: foundList.items})
    } else {
      const list = new List ({
        name: customListName,
        items: defaultItems
      })
      list.save();
      res.redirect("/" + customListName)
    }
  });
  

});



// Add new item
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = _.toLower(req.body.list);

  const item = new Item ({
    name: itemName
  })
  if (listName === "today") {
    item.save();
    res.redirect("/");
  }
  else {
    List.findOne({name: listName}, function(err, foundList) {
      if (err) {
        console.log(err);
      }
      else {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      }
      
    });
  }
  
});



// Delete an item
app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = _.toLower(req.body.listName);

  if (listName ==='today') {
    Item.deleteOne({_id: checkedItemId}, function(err){
      if (err) {
        console.log(err)
      }
      else {
        res.redirect("/")
      }
    });
  }
  else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
      if (err) {
        console.log(err);
      }
      else {
        res.redirect("/" + listName);
      }
    });
  }
  
  
});


app.get("/about", function(req, res){
  res.render("about");
});

var port = process.env.port || 3000;
app.listen(port, function() {
    console.log("Server is running on port " + port + ".");
});
