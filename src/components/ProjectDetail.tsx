import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Typography,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useDropzone } from 'react-dropzone';
import { db } from '../db';
import { Project, Screen } from '../types';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [open, setOpen] = useState(false);
  const [editScreen, setEditScreen] = useState<Screen | null>(null);
  const [newScreen, setNewScreen] = useState({ 
    name: '', 
    description: '',
    imageUrl: '' 
  });
  
  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    onDrop: files => {
      if (files[0]) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setNewScreen(prev => ({
              ...prev,
              imageUrl: reader.result as string
            }));
          }
        };
        reader.readAsDataURL(files[0]);
      }
    }
  });

  const loadProject = useCallback(async () => {
    if (!id) return;
    const project = await db.projects.get(parseInt(id));
    setProject(project || null);
  }, [id]);

  const loadScreens = useCallback(async () => {
    if (!id) return;
    const screens = await db.screens
      .where('projectId')
      .equals(parseInt(id))
      .sortBy('order');
    setScreens(screens);
  }, [id]);

  useEffect(() => {
    if (id) {
      loadProject();
      loadScreens();
    }
  }, [id, loadProject, loadScreens]);

  async function handleCreateScreen() {
    if (!id || !newScreen.name || !newScreen.imageUrl) return;

    await db.screens.add({
      projectId: parseInt(id),
      name: newScreen.name,
      description: newScreen.description,
      imageUrl: newScreen.imageUrl,
      order: screens.length
    });

    setNewScreen({ name: '', description: '', imageUrl: '' });
    setEditScreen(null);
    setOpen(false);
    loadScreens();
  }

  async function handleUpdateScreen() {
    if (!id || !editScreen?.id || !newScreen.name || !newScreen.imageUrl) return;

    await db.screens.update(editScreen.id, {
      ...editScreen,
      name: newScreen.name,
      description: newScreen.description,
      imageUrl: newScreen.imageUrl
    });

    setNewScreen({ name: '', description: '', imageUrl: '' });
    setEditScreen(null);
    setOpen(false);
    loadScreens();
  }

  async function handleDeleteScreen(screenId: number) {
    await db.screens.delete(screenId);
    // Also delete associated APIs
    await db.apis.where('screenId').equals(screenId).delete();
    loadScreens();
  }

  const navigate = useNavigate();

  if (!project) {
    return <Typography>프로젝트를 찾을 수 없습니다.</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">{project.name}</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => {
            setEditScreen(null);
            setNewScreen({ name: '', description: '', imageUrl: '' });
            setOpen(true);
          }}
        >
          화면 추가
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', margin: -1 }}>
        {screens.map(screen => (
          <Box 
            key={screen.id} 
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
              onClick={() => screen.id && navigate(`/project/${id}/screen/${screen.id}`)}
            >
              <CardMedia
                component="img"
                height="200"
                image={screen.imageUrl}
                alt={screen.name}
                sx={{ objectFit: 'contain', bgcolor: 'grey.100' }}
              />
              <CardContent sx={{ position: 'relative' }}>
                <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditScreen(screen);
                      setNewScreen({
                        name: screen.name,
                        description: screen.description || '',
                        imageUrl: screen.imageUrl
                      });
                      setOpen(true);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      screen.id && handleDeleteScreen(screen.id);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
                <Typography variant="h6">{screen.name}</Typography>
                {screen.description && (
                  <Typography color="text.secondary">
                    {screen.description}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{editScreen ? '화면 수정' : '새 화면 추가'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="화면 이름"
            fullWidth
            value={newScreen.name}
            onChange={(e) => setNewScreen(prev => ({ ...prev, name: e.target.value }))}
          />
          <TextField
            margin="dense"
            label="설명 (선택사항)"
            fullWidth
            multiline
            rows={3}
            value={newScreen.description}
            onChange={(e) => setNewScreen(prev => ({ ...prev, description: e.target.value }))}
          />
          <Box
            {...getRootProps()}
            sx={{
              mt: 2,
              p: 3,
              border: '2px dashed',
              borderColor: 'grey.300',
              borderRadius: 1,
              textAlign: 'center',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <input {...getInputProps()} />
            {(newScreen.imageUrl || (editScreen && editScreen.imageUrl)) ? (
              <Box sx={{ position: 'relative' }}>
                <img 
                  src={newScreen.imageUrl || (editScreen?.imageUrl ?? '')} 
                  alt="현재 이미지"
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '200px',
                    objectFit: 'contain'
                  }} 
                /> 
                <Typography sx={{ mt: 1, color: 'text.secondary' }}>
                  새 이미지를 드래그하거나 클릭하여 변경하세요
                </Typography>
              </Box>
            ) : (
              <Typography>
                이미지를 드래그하거나 클릭하여 업로드하세요
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpen(false);
            setEditScreen(null);
            setNewScreen({ name: '', description: '', imageUrl: '' });
          }}>
            취소
          </Button>
          <Button 
            onClick={editScreen ? handleUpdateScreen : handleCreateScreen} 
            variant="contained"
            disabled={!newScreen.name || !newScreen.imageUrl}
          >
            {editScreen ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 