package com.cooksys.groupfinal.services;

import com.cooksys.groupfinal.dtos.CredentialsDto;
import com.cooksys.groupfinal.dtos.FullUserDto;
import com.cooksys.groupfinal.dtos.UserRequestDto;
import com.cooksys.groupfinal.dtos.UserUpdateRequestDto;

public interface UserService {

	FullUserDto login(CredentialsDto credentialsDto);

	FullUserDto addUser(Long companyId, UserRequestDto request);

	FullUserDto updateUser(Long id, UserUpdateRequestDto request);

	void deleteUser(Long id);
	
	void deleteUserPermanent(Long id);

	FullUserDto reinstateUser(Long userId, CredentialsDto request);

}
