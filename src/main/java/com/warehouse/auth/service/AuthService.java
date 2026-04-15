package com.warehouse.auth.service;

import com.warehouse.auth.entity.Owner;
import com.warehouse.auth.repository.OwnerRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final OwnerRepository ownerRepository;

    public AuthService(OwnerRepository ownerRepository) {
        this.ownerRepository = ownerRepository;
    }

    /**
     * Validates credentials against the 'owners' table in the credentials DB.
     */
    public Optional<Owner> authenticate(String username, String password) {
        Optional<Owner> ownerOpt = ownerRepository.findByUsername(username);

        if (ownerOpt.isPresent()) {
            Owner owner = ownerOpt.get();
            if (owner.getPassword().equals(password)) {
                return Optional.of(owner);
            }
        }
        return Optional.empty();
    }
}
