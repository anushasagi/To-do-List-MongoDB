const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));


/****************************************** MONGOOSE **************************************/
//Mongoose connection
mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});

//Mongoose schema - todolistDB
const itemsSchema = {
  name: String
};

//Mongoose Model
const Item = mongoose.model("Item", itemsSchema);

//Mongoose documents
const item1 = new Item({
  name: "Brush"
});

const item2 = new Item({
  name: "Do Yoga"
});

const item3 = new Item({
  name: "Bath"
});

const defaultItems = [item1, item2, item3];


//List Schema
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


/******************************************* GET Method ******************************************/

app.get("/", function(req, res) {

  //Find item documents from collection items
  Item.find({}, function(err, results) {
    if (err){
      console.log(err);
    }
    else{
      if (results.length === 0){

        //Insert items into Database
        Item.insertMany(defaultItems, function(err){
          if (err){
            console.log(err);
          } else{
            console.log("Successfully added default Items to the Database");
          }
        });
        res.redirect("/"); //Once defualt items are added, it will again find items and now falls into else block
      } else {
        res.render("list", {listTitle: "Today", newListItems: results}); //passing values to ejs web page (i.e., list.ejs)
      }

    }
  });


});

app.get("/about", function(req, res) {
  res.render("about");
});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, results){
    if (!err){
      if (results === null){
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save(function(err){
          res.redirect("/" + customListName);
        });
      } else {
        //show an existing list
        console.log("Showing existing list");
        res.render("list", {listTitle: results.name, newListItems: results.items});
      }
    }
    else{
      console.log(err);
    }
  });

});


/******************************************* POST Method ******************************************/

app.post("/", function(req, res) {
  const itemName = req.body.newItem; //item submitted in the form
  const listName = req.body.button; //ListTitle value which called the post method

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save(function(err){
      res.redirect("/");
    });
  }
  else{
    List.findOne({name: listName}, function(err, results){
      results.items.push(item);
      results.save(function(err){
        res.redirect("/" + listName);
      });
    });
  }

});

app.post("/delete", function(req, res) {
  const checkeditemID = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkeditemID, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully deleted the checked item");
      }
    });
    res.redirect("/");
  }
  else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkeditemID}}}, function(err, results){
      if(!err){
        res.redirect("/" + listName);
      }
    })
  }

});

app.listen("3000", function() {
  console.log("App started on port 3000");
});
