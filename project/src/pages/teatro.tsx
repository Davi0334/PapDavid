import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import * as dataService from '../lib/data-service';

const Teatro: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Teatro
        </Typography>
        <Typography variant="body1">
          Esta página está em construção.
        </Typography>
      </Box>
    </Container>
  );
};

export default Teatro;
export { Teatro };