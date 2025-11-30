package com.cooksys.groupfinal.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@Data
public class UserUpdateRequestDto {

	private ProfileDto profile;

	private CredentialsDto credentials;

}
