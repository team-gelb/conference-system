// Navbar.jsx
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import { Link } from 'react-router';
import { styled } from '@stitches/react';

// A styled nav container using Radix theme tokens.
const StyledNav = styled('nav', {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem 1.5rem',
    backgroundColor: '$primary', // using the themed primary color
});

// Style the NavigationMenu List for horizontal layout.
const StyledList = styled(NavigationMenu.List, {
    display: 'flex',
    listStyle: 'none',
    margin: 0,
    padding: 0,
});

// Style each navigation item.
const StyledItem = styled(NavigationMenu.Item, {
    marginRight: '1rem',
});

// Style the Radix-themed Link. Here we’re leveraging our theme’s high contrast text.
const StyledLink = styled(Link, {
    color: '$hiContrast',
    textDecoration: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    transition: 'background-color 0.3s ease',
    '&:hover': {
        backgroundColor: '$muted',
    },
});

const Navbar = () => {
    return (
        <StyledNav>
            <NavigationMenu.Root>
                <StyledList>
                    <StyledItem>
                        <StyledLink to="/">Home</StyledLink>
                    </StyledItem>
                    <StyledItem>
                        <StyledLink to="/about">About</StyledLink>
                    </StyledItem>
                    <StyledItem>
                        <StyledLink to="/contact">Contact</StyledLink>
                    </StyledItem>
                </StyledList>
            </NavigationMenu.Root>
        </StyledNav>
    );
};

export default Navbar;
