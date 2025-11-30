package com.cooksys.groupfinal.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.cooksys.groupfinal.dtos.CredentialsDto;
import com.cooksys.groupfinal.dtos.FullUserDto;
import com.cooksys.groupfinal.dtos.UserUpdateRequestDto;
import com.cooksys.groupfinal.services.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

	private final UserService userService;

	@PostMapping("/login")
	@CrossOrigin(origins = "*")
	public FullUserDto login(@RequestBody CredentialsDto credentialsDto) {
		return userService.login(credentialsDto);
	}

	@PatchMapping("/{userId}")
	public FullUserDto updateUser(@PathVariable Long userId, @RequestBody UserUpdateRequestDto request) {
		return userService.updateUser(userId, request);
	}
	
	@PatchMapping("/{userId}/reinstate")
	public FullUserDto reinstateUser(@PathVariable Long userId, @RequestBody CredentialsDto request) {
		return userService.reinstateUser(userId, request);
	}

	@DeleteMapping("/{userId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteUser(@PathVariable Long userId) {
		userService.deleteUser(userId);
	}
	
	@DeleteMapping("/{userId}/permanent")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteUserPermanent(@PathVariable Long userId) {
		userService.deleteUserPermanent(userId);
	}

}
