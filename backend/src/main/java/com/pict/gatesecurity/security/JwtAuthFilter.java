package com.pict.gatesecurity.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Intercepts every request, extracts the Bearer JWT from the Authorization header,
 * validates it, and sets the Spring Security authentication context.
 *
 * If the token is missing, expired, blacklisted, or not an ACCESS token,
 * the filter does NOT throw — it simply leaves the SecurityContext empty,
 * and the downstream security config handles the 401.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsServiceImpl userDetailsService;
    private final TokenBlacklist tokenBlacklist;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        final String token = extractToken(request);

        if (token != null
                && jwtUtil.isTokenValid(token)
                && jwtUtil.isAccessToken(token)
                && !tokenBlacklist.isBlacklisted(token)
                && SecurityContextHolder.getContext().getAuthentication() == null) {

            String username = jwtUtil.extractUsername(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (userDetails.isEnabled()) {
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities());

                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Extracts the raw JWT string from the "Authorization: Bearer <token>" header.
     * Returns null if the header is absent or malformed.
     */
    private String extractToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }
}
