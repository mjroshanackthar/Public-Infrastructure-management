const express = require('express');
const router = express.Router();

// Get all projects
router.get('/', async (req, res) => {
  try {
    // Mock project data for now
    const projects = [
      {
        id: '1',
        name: 'City Hall Renovation',
        description: 'Complete renovation of the city hall building',
        status: 'in_progress',
        budget: 500000,
        startDate: '2024-01-15',
        endDate: '2024-12-31',
        contractor: 'ABC Construction',
        progress: 45
      },
      {
        id: '2',
        name: 'Bridge Construction',
        description: 'New bridge over the river',
        status: 'planning',
        budget: 1200000,
        startDate: '2024-06-01',
        endDate: '2025-05-31',
        contractor: 'XYZ Engineering',
        progress: 10
      }
    ];
    
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get project by ID
router.get('/:id', async (req, res) => {
  try {
    // Mock project data
    const project = {
      id: req.params.id,
      name: 'City Hall Renovation',
      description: 'Complete renovation of the city hall building',
      status: 'in_progress',
      budget: 500000,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      contractor: 'ABC Construction',
      progress: 45,
      milestones: [
        { name: 'Foundation', completed: true, date: '2024-02-15' },
        { name: 'Structure', completed: true, date: '2024-05-30' },
        { name: 'Interior', completed: false, date: '2024-09-15' },
        { name: 'Finishing', completed: false, date: '2024-12-31' }
      ]
    };
    
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new project
router.post('/', async (req, res) => {
  try {
    
    const { name, description, budget, startDate, endDate, contractor } = req.body;
    
    // Mock project creation
    const project = {
      id: Date.now().toString(),
      name,
      description,
      budget,
      startDate,
      endDate,
      contractor,
      status: 'planning',
      progress: 0,
      createdAt: new Date()
    };
    
    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update project progress
router.put('/:id/progress', async (req, res) => {
  try {
    const { progress, status } = req.body;
    
    // Mock project update
    const project = {
      id: req.params.id,
      progress: progress || 0,
      status: status || 'in_progress',
      updatedAt: new Date()
    };
    
    res.json({
      message: 'Project progress updated successfully',
      project
    });
  } catch (error) {
    console.error('Error updating project progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;