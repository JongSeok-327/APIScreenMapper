import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField, 
  Typography 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { db } from '../db';
import { Project } from '../types';
import { useNavigate } from 'react-router-dom';

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    const projects = await db.projects.toArray();
    setProjects(projects);
  }

  async function handleCreateProject() {
    if (!newProject.name) return;

    await db.projects.add({
      name: newProject.name,
      description: newProject.description,
      createdAt: Date.now()
    });

    setNewProject({ name: '', description: '' });
    setOpen(false);
    loadProjects();
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">프로젝트</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          새 프로젝트
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', margin: -1 }}>
        {projects.map(project => (
          <Box 
            key={project.id} 
            sx={{ 
              width: { 
                xs: '100%', 
                sm: '50%', 
                md: '33.333%' 
              },
              p: 1
            }}
          >
            <Card 
              sx={{ cursor: 'pointer' }}
              onClick={() => navigate(`/project/${project.id}`)}
            >
              <CardContent>
                <Typography variant="h6">{project.name}</Typography>
                {project.description && (
                  <Typography color="text.secondary">
                    {project.description}
                  </Typography>
                )}
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  생성일: {new Date(project.createdAt).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>새 프로젝트 생성</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="프로젝트 이름"
            fullWidth
            value={newProject.name}
            onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
          />
          <TextField
            margin="dense"
            label="설명 (선택사항)"
            fullWidth
            multiline
            rows={3}
            value={newProject.description}
            onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>취소</Button>
          <Button onClick={handleCreateProject} variant="contained">
            생성
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 