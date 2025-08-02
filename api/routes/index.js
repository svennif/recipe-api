import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../utils/db.js'
import { logger } from '../utils/logger.js';

const router = express.Router();

router.get('/recipes', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  try {
    const db = getDb();
    const collection = db.collection('recipes');
    const allRecipes = await collection
      .find({})
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()

    const recipeCount = await collection.countDocuments();

    await logger.info('Recipes fetched successfully', {
      count: allRecipes.length,
      total: recipeCount,
      page,
      limit
    });

    res.json({
      page,
      limit,
      recipeCount,
      totalPages: Math.ceil(recipeCount / limit),
      allRecipes
    });
  } catch (err) {
    await logger.error('Failed to fetch recipes', {
      error: err.message,
      stack: err.stack,
      page,
      limit
    });
    res.status(500).json({ error: 'Failed to fetch recipes ' });
  }
});

router.get('/recipe/:id', async (req, res) => {
  try {
    const db = getDb();
    const recipeId = req.params.id;

    await logger.info('Fetching recipe by ID', { recipeId });

    if (!ObjectId.isValid(recipeId)) {
      await logger.warn('Invalid recipe ID format provided', { recipeId });
      return res.status(400).json({ error: 'Invalid recipe ID format' });
    }

    const recipe = await db.collection('recipes').findOne({
      _id: new ObjectId(recipeId)
    });

    if (!recipe) {
      await logger.warn('Recipe not found', { recipeId });
      return res.status(404).json({ error: 'Recipe not found ' });
    }

    await logger.info('Recipe fetched successfully', {
      recipeId,
      title: recipe.title
    });

    res.json(recipe);
  } catch (err) {
    await logger.error('Failed to fetch recipe', {
      error: err.message,
      stack: err.stack,
      recipeId: req.params.id
    });
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
});

router.post('/recipes/add', async (req, res) => {
  try {
    await logger.info('Adding new recipe', {
      title: req.body.title,
      difficulty: req.body.difficulty,
      userId: req.user?.id,
      userEmail: req.user?.email
    });

    const db = getDb();
    const now = new Date();
    const newRecipe = await db.collection('recipes').insertOne({
      title: req.body.title,
      difficulty: req.body.difficulty,
      ingredients: req.body.ingredients,
      instructions: req.body.instructions,
      description: req.body.description,
      tags: req.body.tags,
      cookingTime: req.body.cookingTime,
      createdBy: req.user.id,
      createdAt: now,
      updatedAt: now
    });

    await logger.info('Recipe added successfully', {
      insertedId: newRecipe.insertedId,
      title: req.body.title
    });

    res.status(201).json({
      message: 'Recipe added successfully',
      insertedId: newRecipe.insertedId,
      recipe: {
        _id: newRecipe.insertedId,
        title: req.body.title,
        difficulty: req.body.difficulty,
        ingredients: req.body.ingredients,
        instructions: req.body.instructions,
        description: req.body.description,
        tags: req.body.tags,
        cookingTime: req.body.cookingTime,
        createdAt: now,
        updatedAt: now
      }
    });
  } catch (err) {
    await logger.error('Failed to add recipe', {
      error: err.message,
      stack: err.stack,
      title: req.body.title
    });
    res.status(500).json({ error: 'Failed to add recipe' });
  }
});

router.put('/recipe/:id', async (req, res) => {
  try {
    const db = getDb();
    const recipeId = req.params.id;

    await logger.info('Updating recipe', {
      recipeId,
      title: req.body.title
    });

    if (!ObjectId.isValid(recipeId)) {
      await logger.warn('Invalid recipe ID format for update', { recipeId });
      return res.status(400).json({ error: 'Invalid recipe ID format' });
    }

    const updateRecipe = await db.collection('recipes').updateOne(
      { _id: new ObjectId(recipeId) },
      {
        $set: {
          title: req.body.title,
          difficulty: req.body.difficulty,
          ingredients: req.body.ingredients,
          instructions: req.body.instructions, // Fixed: was 'instruction'
          description: req.body.description,
          tags: req.body.tags,
          cookingTime: req.body.cookingTime,
          updatedAt: new Date()
        }
      }
    );

    if (updateRecipe.matchedCount === 0) {
      await logger.warn('Recipe not found for update', { recipeId });
      return res.status(404).json({ error: 'Recipe not found' });
    }

    await logger.info('Recipe updated successfully', {
      recipeId,
      modifiedCount: updateRecipe.modifiedCount,
      title: req.body.title
    });

    res.json({
      message: 'Recipe updated successfully',
      modifiedCount: updateRecipe.modifiedCount,
      matchedCount: updateRecipe.matchedCount
    });
  } catch (err) {
    await logger.error('Failed to update recipe', {
      error: err.message,
      stack: err.stack,
      recipeId: req.params.id
    });
    res.status(500).json({ error: 'Failed to update recipe' });
  }
});

router.patch('/recipe/:id', async (req, res) => {
  try {
    const db = getDb();
    const recipeId = req.params.id;

    await logger.info('Patching recipe', {
      recipeId,
      fields: Object.keys(req.body)
    });

    if (!ObjectId.isValid(recipeId)) {
      await logger.warn('Invalid recipe ID format for patch', { recipeId });
      return res.status(400).json({ error: 'Invalid recipe ID format' });
    }

    const updateFields = {};
    // TODO: make this into a schema
    const allowedFields = ['title', 'difficulty', 'ingredients', 'instructions', 'description', 'tags', 'cookingTime'];

    allowedFields.forEach(field => {
      if (req.body.hasOwnProperty(field) && req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    });

    if (Object.keys(updateFields).length === 0) {
      await logger.warn('No valid fields provided for patch', {
        recipeId,
        providedFields: Object.keys(req.body)
      });
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    updateFields.updatedAt = new Date();

    const patchResult = await db.collection('recipes').updateOne(
      { _id: new ObjectId(recipeId) },
      { $set: updateFields }
    );

    if (patchResult.matchedCount === 0) {
      await logger.warn('Recipe not found for patch', { recipeId });
      return res.status(404).json({ error: 'Recipe not found' });
    }

    await logger.info('Recipe patched successfully', {
      recipeId,
      modifiedCount: patchResult.modifiedCount,
      updatedFields: Object.keys(updateFields).filter(key => key !== 'updatedAt')
    });

    const updatedRecipe = await db.collection('recipes').findOne({
      _id: new ObjectId(recipeId)
    });

    res.json({
      message: 'Recipe updated successfully',
      modifiedCount: patchResult.modifiedCount,
      updatedFields: Object.keys(updateFields).filter(key => key !== 'updatedAt'),
      recipe: updatedRecipe
    });

  } catch (err) {
    await logger.error('Failed to patch recipe', {
      error: err.message,
      stack: err.stack,
      recipeId: req.params.id
    });
    res.status(500).json({ error: 'Failed to patch recipe' });
  }
});

router.delete('/recipe/:id', async (req, res) => {
  try {
    const db = getDb();
    const recipeId = req.params.id;

    await logger.info('Deleting recipe', { recipeId });

    if (!ObjectId.isValid(recipeId)) {
      await logger.warn('Invalid recipe ID format for deletion', { recipeId });
      return res.status(400).json({ error: 'Invalid recipe ID format' });
    }

    const deleteRecipe = await db.collection('recipes').deleteOne({
      _id: new ObjectId(recipeId)
    });

    if (deleteRecipe.deletedCount === 0) {
      await logger.warn('Recipe not found for deletion', { recipeId });
      return res.status(404).json({ error: 'Recipe not found' });
    }

    await logger.info('Recipe deleted successfully', {
      recipeId,
      deletedCount: deleteRecipe.deletedCount
    });

    res.json({
      message: 'Recipe deleted successfully',
      deletedCount: deleteRecipe.deletedCount
    });
  } catch (err) {
    await logger.error('Failed to delete recipe', {
      error: err.message,
      stack: err.stack,
      recipeId: req.params.id
    });
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

export default router;