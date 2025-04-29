import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import ScreenDetail from './components/ScreenDetail';
import Layout from './components/Layout';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<ProjectList />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
            <Route path="/project/:projectId/screen/:screenId" element={<ScreenDetail />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
