import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Tooltip,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import { db } from '../db';
import { Screen, GraphQLAPI } from '../types';
import Editor from '@monaco-editor/react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { PromiseExtended } from 'dexie';

type ApiType = 'query' | 'mutation';

interface NewApi {
  name: string;
  type: ApiType;
  code: string;
  description: string;
  position: { x: number; y: number };
}

export default function ScreenDetail() {
  const { projectId, screenId } = useParams<{ projectId: string; screenId: string }>();
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen | null>(null);
  const [apis, setApis] = useState<GraphQLAPI[]>([]);
  const [selectedApi, setSelectedApi] = useState<GraphQLAPI | null>(null);
  const [hoveredApiId, setHoveredApiId] = useState<number | null>(null);
  const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);
  const [newApi, setNewApi] = useState<NewApi>({
    name: '',
    type: 'query',
    code: '',
    description: '',
    position: { x: 50, y: 50 }
  });
  const [draggedApi, setDraggedApi] = useState<number | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [draggedListItem, setDraggedListItem] = useState<number | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [projectName, setProjectName] = useState<string>('');

  const loadScreen = useCallback(async () => {
    if (!screenId) return;
    const screen = await db.screens.get(parseInt(screenId));
    setScreen(screen || null);
  }, [screenId]);

  const loadApis = useCallback(async () => {
    if (!screenId) return;
    const apis = await db.apis.where('screenId').equals(parseInt(screenId)).toArray();
    // order 필드로 정렬, order가 없는 경우는 마지막으로
    const sortedApis = [...apis].sort((a, b) => {
      const orderA = (a as GraphQLAPI & { order?: number }).order ?? Number.MAX_SAFE_INTEGER;
      const orderB = (b as GraphQLAPI & { order?: number }).order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
    setApis(sortedApis);
  }, [screenId]);

  useEffect(() => {
    loadScreen();
    loadApis();
  }, [loadScreen, loadApis]);

  // 한글 폰트 로드 - base64 문자열로 직접 저장
  useEffect(() => {
    const loadNotoSansKR = async () => {
      try {
        const font = await fetch('/NotoSansKR-Regular.ttf');
        const fontBlob = await font.blob();
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          localStorage.setItem('notoSansKR', base64.split(',')[1]);
        };
        reader.readAsDataURL(fontBlob);
      } catch (error) {
        console.error('폰트 로딩 실패:', error);
      }
    };
    loadNotoSansKR();
  }, []);

  // 프로젝트 이름 로드
  useEffect(() => {
    const loadProjectName = async () => {
      if (!projectId) return;
      const project = await db.projects.get(parseInt(projectId));
      if (project) {
        setProjectName(project.name);
      }
    };
    loadProjectName();
  }, [projectId]);

  const handleDragStart = (apiId: number) => (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', apiId.toString());
    setDraggedApi(apiId);
  };

  const handleDragEnd = () => {
    setDraggedApi(null);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const apiId = parseInt(e.dataTransfer.getData('text/plain'));
    if (!imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    await db.apis.update(apiId, {
      position: { x, y }
    });
    loadApis();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();
    
    // 이미지의 실제 크기와 표시되는 크기의 비율 계산
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;
    
    // 클릭 위치를 이미지 내부의 상대적 위치로 변환
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setSelectedApi(null);
    setNewApi({
      name: '',
      type: 'query',
      code: '',
      description: '',
      position: { x, y }
    });
    setIsApiDialogOpen(true);
  };

  const handleSaveApi = async () => {
    if (!screenId || !newApi.name || !newApi.code) return;

    if (selectedApi?.id) {
      // Update existing API
      await db.apis.update(selectedApi.id, {
        ...newApi,
        screenId: parseInt(screenId)
      });
    } else {
      // Create new API
      await db.apis.add({
        ...newApi,
        screenId: parseInt(screenId)
      });
    }

    setNewApi({
      name: '',
      type: 'query',
      code: '',
      description: '',
      position: { x: 50, y: 50 }
    });
    setSelectedApi(null);
    setIsApiDialogOpen(false);
    loadApis();
  };

  const handleDeleteApi = async (apiId: number) => {
    await db.apis.delete(apiId);
    loadApis();
  };

  // 내보내기 메뉴 핸들러
  const handleExportClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  // API 목록을 타입별로 분류하고 번호 매기기
  const getNumberedApis = useCallback(() => {
    const queries = apis.filter(api => api.type === 'query');
    const mutations = apis.filter(api => api.type === 'mutation');

    return apis.map(api => {
      const number = api.type === 'query' 
        ? `Q${queries.findIndex(q => q.id === api.id) + 1}`
        : `M${mutations.findIndex(m => m.id === api.id) + 1}`;
      return { ...api, number };
    });
  }, [apis]);

  // 이미지로 내보내기
  const handleExportImage = async () => {
    const screenElement = document.querySelector('.screen-capture') as HTMLElement;
    if (!screenElement || !screen) return;

    const canvas = await html2canvas(screenElement, {
      scale: 2,
      backgroundColor: '#ffffff'
    });

    // 이미지 다운로드
    const link = document.createElement('a');
    link.download = `${screen.name}-screen.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    handleExportClose();
  };

  // API 목록을 마크다운으로 내보내기
  const handleExportMarkdown = () => {
    if (!screen || !apis.length) return;

    const numberedApis = getNumberedApis();
    let markdown = `# ${screen.name}\n\n`;
    
    if (screen.description) {
      markdown += `${screen.description}\n\n`;
    }

    // Query 목록
    const queries = numberedApis.filter(api => api.type === 'query');
    if (queries.length > 0) {
      markdown += `## Queries\n\n`;
      queries.forEach(api => {
        markdown += `### ${api.number}. ${api.name}\n\n`;
        if (api.description) {
          markdown += `${api.description}\n\n`;
        }
        markdown += '```graphql\n';
        markdown += `${api.code}\n`;
        markdown += '```\n\n';
      });
    }

    // Mutation 목록
    const mutations = numberedApis.filter(api => api.type === 'mutation');
    if (mutations.length > 0) {
      markdown += `## Mutations\n\n`;
      mutations.forEach(api => {
        markdown += `### ${api.number}. ${api.name}\n\n`;
        if (api.description) {
          markdown += `${api.description}\n\n`;
        }
        markdown += '```graphql\n';
        markdown += `${api.code}\n`;
        markdown += '```\n\n';
      });
    }

    // 마크다운 파일 다운로드
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const link = document.createElement('a');
    link.download = `${screen.name}-apis.md`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
    handleExportClose();
  };

  // 이미지와 마크다운 함께 내보내기
  const handleExportBoth = async () => {
    await handleExportImage();
    handleExportMarkdown();
  };

  // API 순서 업데이트
  const handleUpdateApiOrder = async (reorderedApis: GraphQLAPI[]) => {
    // 각 API의 순서를 업데이트
    const updates = reorderedApis.map((api, index) => {
      if (!api.id) return null;
      return db.apis.update(api.id, { order: index } as Partial<GraphQLAPI>);
    }).filter((update): update is PromiseExtended<number> => update !== null);
    
    await Promise.all(updates);
    loadApis();
  };

  // API 목록 드래그 시작
  const handleListDragStart = (e: React.DragEvent<HTMLDivElement>, apiId: number) => {
    setDraggedListItem(apiId);
    e.currentTarget.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
  };

  // API 목록 드래그 종료
  const handleListDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    setDraggedListItem(null);
    e.currentTarget.style.opacity = '1';
  };

  // API 목록 드래그 오버
  const handleListDragOver = (e: React.DragEvent<HTMLDivElement>, apiId: number) => {
    e.preventDefault();
    if (draggedListItem === null || draggedListItem === apiId) return;

    const draggedIndex = apis.findIndex(api => api.id === draggedListItem);
    const hoverIndex = apis.findIndex(api => api.id === apiId);

    if (draggedIndex === -1 || hoverIndex === -1) return;

    // 순서 변경
    const newApis = [...apis];
    const [draggedApi] = newApis.splice(draggedIndex, 1);
    newApis.splice(hoverIndex, 0, draggedApi);
    
    setApis(newApis);
  };

  // API 목록 드롭
  const handleListDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleUpdateApiOrder(apis);
  };

  // 메뉴 핸들러
  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  if (!screen) {
    return <Typography>화면을 찾을 수 없습니다.</Typography>;
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ 
        mb: 3, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        borderBottom: 1,
        borderColor: 'divider',
        p: 2,
        bgcolor: 'background.paper'
      }}>
        <Typography 
          variant="h5" 
          sx={{ 
            flex: 1,
            fontWeight: 'medium',
            color: 'text.primary',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <IconButton 
            onClick={handleMenuOpen}
            size="small"
            sx={{ color: 'text.primary' }}
          >
            <MenuIcon />
          </IconButton>
          {screen.name}
        </Typography>
        <Tooltip title="내보내기">
          <IconButton 
            onClick={handleExportClick}
            disabled={!apis.length}
            color="primary"
          >
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: { minWidth: 200 }
        }}
      >
        <MenuItem 
          onClick={() => {
            navigate('/');
            handleMenuClose();
          }}
          sx={{ 
            py: 1.5,
            display: 'flex', 
            alignItems: 'center', 
            gap: 2 
          }}
        >
          <HomeIcon fontSize="small" />
          홈으로
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => {
            navigate(`/project/${projectId}`);
            handleMenuClose();
          }}
          sx={{ 
            py: 1.5,
            display: 'flex', 
            alignItems: 'center', 
            gap: 2 
          }}
        >
          <FolderIcon fontSize="small" />
          {projectName || '프로젝트'} 화면 목록
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={exportAnchorEl}
        open={Boolean(exportAnchorEl)}
        onClose={handleExportClose}
        PaperProps={{
          elevation: 3,
          sx: { minWidth: 220 }
        }}
      >
        <MenuItem 
          onClick={handleExportImage}
          sx={{ py: 1.5 }}
        >
          이미지로 내보내기 (.png)
        </MenuItem>
        <MenuItem 
          onClick={handleExportMarkdown}
          sx={{ py: 1.5 }}
        >
          API 목록 내보내기 (.md)
        </MenuItem>
        <MenuItem 
          onClick={handleExportBoth}
          sx={{ py: 1.5 }}
        >
          이미지와 API 목록 모두 내보내기
        </MenuItem>
      </Menu>

      <Box sx={{ mb: 2 }}>
        <Typography color="text.secondary">
          화면의 원하는 위치를 클릭하여 API 포인트를 추가하세요.
          파란색은 Query, 보라색은 Mutation을 나타냅니다.
        </Typography>
      </Box>

      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        gap: 3,
        minHeight: 0 // Flex 컨테이너 내부 스크롤을 위해 필요
      }}>
        {/* 왼쪽: 이미지와 API 포인트 */}
        <Paper 
          className="screen-capture"
          sx={{ 
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'grey.100',
            cursor: draggedApi !== null ? 'grabbing' : 'crosshair'
          }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Box sx={{ position: 'relative' }}>
            <img 
              ref={imgRef}
              className="screen-image"
              src={screen.imageUrl} 
              alt={screen.name}
              onClick={handleImageClick}
              style={{ 
                maxWidth: '100%',
                maxHeight: 'calc(100vh - 200px)',
                objectFit: 'contain',
                display: 'block'
              }}
            />
            {getNumberedApis().map(api => {
              if (!api.id) return null;
              const position = api.position || { x: 50, y: 50 };
              
              return (
                <div
                  key={api.id}
                  draggable
                  onDragStart={handleDragStart(api.id)}
                  onDragEnd={handleDragEnd}
                  style={{
                    position: 'absolute',
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: api.type === 'query' ? '#1976d2' : '#9c27b0',
                    cursor: draggedApi === api.id ? 'grabbing' : 'grab',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '3px solid white',
                    boxShadow: '0 3px 6px rgba(0,0,0,0.3)',
                    transition: 'all 0.2s',
                    zIndex: hoveredApiId === api.id ? 2 : 1,
                    ...(hoveredApiId === api.id && {
                      transform: 'translate(-50%, -50%) scale(1.2)',
                      boxShadow: '0 0 0 4px rgba(0,0,0,0.2), 0 6px 12px rgba(0,0,0,0.4)',
                    })
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (draggedApi === null) {
                      setSelectedApi(api);
                      setNewApi({
                        name: api.name,
                        type: api.type,
                        code: api.code,
                        description: api.description || '',
                        position: api.position || { x: 50, y: 50 }
                      });
                      setIsApiDialogOpen(true);
                    }
                  }}
                  onMouseEnter={() => api.id && setHoveredApiId(api.id)}
                  onMouseLeave={() => setHoveredApiId(null)}
                >
                  <Typography sx={{ 
                    fontSize: '14px', 
                    color: 'white', 
                    fontWeight: 'bold',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    pointerEvents: 'none'
                  }}>
                    {api.number}
                  </Typography>
                  <div
                    className="api-label"
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: '50%',
                      transform: 'translateX(-50%) translateY(10px)',
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                      opacity: hoveredApiId === api.id ? 1 : 0,
                      visibility: hoveredApiId === api.id ? 'visible' : 'hidden',
                      transition: 'all 0.2s',
                      marginBottom: '8px',
                      zIndex: 2
                    }}
                  >
                    {`${api.number}. ${api.name}`}
                  </div>
                </div>
              );
            })}
          </Box>
        </Paper>

        {/* 오른쪽: API 목록 */}
        <Paper sx={{ 
          width: 300, 
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <Typography variant="h6" sx={{ mb: 2 }}>API 목록</Typography>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            mb: 2 
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              fontSize: '0.875rem' 
            }}>
              <Box sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                bgcolor: 'primary.main' 
              }} />
              Query
            </Box>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              fontSize: '0.875rem'
            }}>
              <Box sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                bgcolor: 'secondary.main' 
              }} />
              Mutation
            </Box>
          </Box>

          <Box sx={{ 
            flex: 1, 
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}>
            {getNumberedApis().map(api => (
              <Paper
                key={api.id}
                variant="outlined"
                draggable
                onDragStart={(e) => api.id && handleListDragStart(e, api.id)}
                onDragEnd={handleListDragEnd}
                onDragOver={(e) => api.id && handleListDragOver(e, api.id)}
                onDrop={handleListDrop}
                sx={{ 
                  p: 1.5,
                  cursor: 'grab',
                  transition: 'all 0.2s',
                  bgcolor: hoveredApiId === api.id ? 'action.hover' : 'transparent',
                  borderColor: hoveredApiId === api.id ? 'primary.main' : 'divider',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    borderColor: 'primary.main'
                  },
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1
                }}
                onClick={() => {
                  if (api.id) {
                    setSelectedApi(api);
                    setNewApi({
                      name: api.name,
                      type: api.type,
                      code: api.code,
                      description: api.description || '',
                      position: api.position || { x: 50, y: 50 }
                    });
                    setIsApiDialogOpen(true);
                  }
                }}
                onMouseEnter={() => api.id && setHoveredApiId(api.id)}
                onMouseLeave={() => setHoveredApiId(null)}
              >
                <DragIndicatorIcon 
                  sx={{ 
                    color: 'text.secondary',
                    cursor: 'grab',
                    fontSize: 20,
                    mt: 0.5
                  }} 
                />
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      bgcolor: api.type === 'query' ? 'primary.main' : 'secondary.main',
                      flexShrink: 0
                    }} />
                    <Typography sx={{ 
                      fontWeight: 'medium',
                      fontSize: '0.875rem',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {`${api.number}. ${api.name}`}
                    </Typography>
                  </Box>
                  {api.description && (
                    <Typography sx={{ 
                      fontSize: '0.75rem',
                      color: 'text.secondary',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {api.description}
                    </Typography>
                  )}
                </Box>
              </Paper>
            ))}
          </Box>
        </Paper>
      </Box>

      <Dialog 
        open={isApiDialogOpen} 
        onClose={() => setIsApiDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedApi ? 'API 수정' : 'API 추가'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              autoFocus
              label="API 이름"
              fullWidth
              value={newApi.name}
              onChange={(e) => setNewApi(prev => ({ ...prev, name: e.target.value }))}
            />
            <TextField
              select
              label="타입"
              fullWidth
              value={newApi.type}
              onChange={(e) => setNewApi(prev => ({ ...prev, type: e.target.value as 'query' | 'mutation' }))}
              SelectProps={{
                native: true
              }}
            >
              <option value="query">Query</option>
              <option value="mutation">Mutation</option>
            </TextField>
            <TextField
              label="설명"
              fullWidth
              multiline
              rows={2}
              value={newApi.description}
              onChange={(e) => setNewApi(prev => ({ ...prev, description: e.target.value }))}
            />
            <Typography variant="subtitle2" sx={{ mt: 1 }}>GraphQL {newApi.type}</Typography>
            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Editor
                height="300px"
                defaultLanguage="graphql"
                value={newApi.code}
                onChange={(value) => setNewApi(prev => ({ ...prev, code: value || '' }))}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on'
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsApiDialogOpen(false)}>취소</Button>
          {selectedApi && (
            <Button 
              onClick={() => {
                if (selectedApi.id) {
                  handleDeleteApi(selectedApi.id);
                  setIsApiDialogOpen(false);
                }
              }} 
              color="error"
            >
              삭제
            </Button>
          )}
          <Button onClick={handleSaveApi} variant="contained">
            {selectedApi ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 