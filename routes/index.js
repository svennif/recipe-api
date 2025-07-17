import express from 'express';
import { ObjectId } from 'mongodb';
import { db } from '../db/connect.js'

const router = express.Router();

router.get('/recipes', async (req, res) => {
  try {
    const allRecipes = await db.collection('recipes').find({}).toArray();
    res.json(allRecipes);
  } catch (err) {
    console.error('Error fetching recipes: ', err);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

router.get('/recipe/:id', async (req, res) => {
  try {
    const recipeId = req.params.id;

    if (!ObjectId.isValid(recipeId)) {
      return res.status(400).json({ error: 'Invalid recipe ID format' });
    }

    const recipe = await db.collection('recipes').findOne({
      _id: new ObjectId(recipeId)
    });

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found ' });
    }

    res.json(recipe);
  } catch (err) {
    console.error('Error fetching recipe:', err);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
});

router.post('/recipes/add', async (req, res) => {
  try {
    const newRecipe = await db.collection('recipes').insertOne({
      title: req.body.title,
      difficulty: req.body.difficulty,
      ingredients: req.body.ingredients,
      description: req.body.description,
    });

    res.status(201).json({
      message: 'Recipe added successfully',
      insertedId: newRecipe.insertedId,
      recipe: {
        _id: newRecipe.insertedId,
        title: req.body.title,
        difficulty: req.body.difficulty,
        ingredients: req.body.ingredients,
        description: req.body.description,
      }
    });
  } catch (err) {
    console.error('Error adding recipe:', err);
    res.status(500).json({ error: 'Failed to add recipe' });
  }
});

router.put('/recipe/:id', async (req, res) => {
  try {
    const recipeId = req.params.id;

    if (!ObjectId.isValid(recipeId)) {
      return res.status(400).json({ error: 'Invalid recipe ID format' });
    }

    const updateRecipe = await db.collection('recipes').updateOne(
      { _id: new ObjectId(recipeId) },
      {
        $set: {
          title: req.body.title,
          difficulty: req.body.difficulty,
          ingredients: req.body.ingredients,
          description: req.body.description,
        }
      }
    );

    if (updateRecipe.matchedCount === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    res.json({
      message: 'Recipe updated successfully',
      modifiedCount: updateRecipe.modifiedCount,
      matchedCount: updateRecipe.matchedCount
    });
  } catch (err) {
    console.error('Error updating recipe:', err);
    res.status(500).json({ error: 'Failed to update recipe' });
  }
});

router.delete('/recipe/:id', async (req, res) => {
  try {
    const recipeId = req.params.id;

    if (!ObjectId.isValid(recipeId)) {
      return res.status(400).json({ error: 'Invalid recipe ID format' });
    }

    const deleteRecipe = await db.collection('recipes').deleteOne({
      _id: new ObjectId(recipeId)
    });

    if (deleteRecipe.deletedCount === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    res.json({
      message: 'Recipe deleted successfully',
      deletedCount: deleteRecipe.deletedCount
    });
  } catch (err) {
    console.error('Error deleting recipe', err);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

export default router;